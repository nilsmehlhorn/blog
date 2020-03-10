---
path: "/posts/angular-file-download-progress"
date: "2020-03-03"
title: "Angular File Download with Progress"
published: true
banner: "./angular-file-download-progress.png"
tags: ["web development", "frontend", "angular"]
keywords: ["angular download link", "rxjs", "download progress bar", "loading", "observable"]
description: "NgIf and the AsyncPipe are great for handling observables in Angular but we can build a structural directive that's even better."
---

Downloading files is a common task for web applications. These files could be some PDF, ZIP or any other binary or text-based file that you want to make accessible to your users. Here's how you can download files in Angular either with a rather simple link or JavaScript-based for more control and progress indication.

## Angular Download Link

A simple download link can be easily achieved with plain HTML in Angular. You'll use an anchor tag pointing to the file with the `href` attribute. The `download` attribute informs the browser that it shouldn't follow the link but rather download the URL target. You can also specify its value in order to set the name of the file being downloaded.

```html
<a href="/downloads/archive.zip" 
  download="archive.zip">
  archive.zip
</a>
``` 

You can bind any of these attributes with Angular in order to set the URL and filename dynamically:

```html
<a [href]="download.url" [download]="download.filename">
  {{ download.filename }}
</a>
``` 

Older browsers, like the Internet Explorer, might not recognize the `download` attribute. For those cases you can open the download in a new browser tab with the `target` attribute set to `_blank`. Make sure though to always include `rel="noopener noreferrer"` when you're using `target="_blank"` so you're not opening yourself up to [security vulnerabilities](https://mathiasbynens.github.io/rel-noopener/).

```html
<a [href]="download.url" target="_blank" rel="noopener noreferrer">
  {{ download.filename }}
</a>
``` 

If there's no `download` attribute, the filename for your download will solely depend on the HTTP header [Content-Disposition](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition) sent by the server that's providing the file. The information from this header might also take precedence even if the `download` attribute is present. 

> _Recommended Read:_  
> [Building a Good Download… Button?](https://css-tricks.com/building-good-download-button/) - Eric Bailey

A link-based solution conforms well to HTML standards and lets the browser do most of the work. However, if you want more control over the download and would like to display some custom progress indicator you can also download files via Angular's [HttpClient](https://angular.io/api/common/http/HttpClient).  

## Download File with HttpClient

A file is best represented as a [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob) in the browser:

>  The Blob object represents a blob, which is a file-like object of immutable, raw data
> -- MDN web docs

By specifying the `responseType` option we can perform a GET request returning a blob representing the downloaded file. Let's assume we've got a designated `DownloadService` doing just that:

```typescript
@Injectable({providedIn: 'root'})
export class DownloadService {

  constructor(private http: HttpClient) {}

  download(url: string): Observable<Blob> {
    return this.http.get(url, {
      responseType: 'blob'
    })
  }
}
```

A component would then be able to call this service, subscribe to the corresponding observable and eventually save the file like this:

```typescript
@Component({...})
export class MyComponent  {

  constructor(private downloads: DownloadService) {}

  download(): void {
    this.downloads
      .download('/downloads/archive.zip')
      .subscribe(blob => {
        const a = document.createElement('a')
        const objectUrl = URL.createObjectURL(blob)
        a.href = objectUrl
        a.download = 'archive.zip';
        a.click();
        URL.revokeObjectURL(objectUrl);
      })
  }
}
```

Here, we're creating an anchor tag programmatically when the blob arrives. With [URL.createObjectURL](https://developer.mozilla.org/de/docs/Web/API/URL/createObjectURL) we can generate a download link to the blob. Finally, we `click()` the link like the user would've done with a regular browser download link. After the file is downloaded, we'll discard the blob by revoking the object URL we created.

This approach is pretty verbose though and might not work smoothly for every browser. Therefore I'd advise you to use the popular library [FileSaver.js](https://github.com/eligrey/FileSaver.js/) when saving blobs. The saving then becomes a one-liner:
```typescript
import { saveAs } from 'file-saver';

download() {
    this.downloads
      .download('/downloads/archive.zip')
      .subscribe(blob => saveAs(blob, 'archive.zip'))
}
```

_If you don't like adding a dependency for this and would prefer to use the manual approach shown before, you might as well refactor the code for saving the blob into a separate service. There you probably want to inject `document` with Angular's built-in injection token [DOCUMENT](https://angular.io/api/common/DOCUMENT). You can also [create a custom injection token](https://angular.io/guide/dependency-injection-in-action#supply-a-custom-provider-with-inject) for `URL` - also see below how we'll do this for FileSaver.js._

## Calculating the Download Progress

By setting the option `observe` to `events` while making an HTTP request, we won't just receive the final response body of the request but also get access to intermediate HTTP events. There are multiple kinds of HTTP events in Angular, all consolidated under the type [HttpEvent](https://angular.io/api/common/http/HttpEvent). We also need to explicitly pass the option `reportProgress` in order to receive [HttpProgressEvents](https://angular.io/api/common/http/HttpProgressEvent). Our HTTP request will eventually look like follows:

```typescript
this.http.get(url, {
  reportProgress: true,
  observe: 'events',
  responseType: 'blob'
})
```

Since we don't just want to forward these events to every component, our service has to do some more work. Otherwise our component would have to deal with HTTP specifics - that's what services are for! Instead let's introduce a data structure representing a download with progress:

```typescript
export interface Download {
  state: 'PENDING' | 'IN_PROGRESS' | 'DONE'
  progress: number
  content: Blob | null
}
```

A `Download` can be in one of three states. Either it hasn't started yet, therefore it's pending. Otherwise it's done or still in progress. We use [TypeScript's union types](https://www.typescriptlang.org/docs/handbook/advanced-types.html#union-types) to define the different download states. Additionally, a download has a number indicating the download progress from 1 to 100. Once a download is done, it will contain a Blob as its `content` - until then this property is not available, therefore `null`.

Now we want to abstract from specific HTTP events to our newly defined data structure. This way our components can be decoupled from the underlying network protocol. Since we're dealing with multiple events coming in over time, a RxJS operator is well suited here - so let's create one!

The first step for this will be the creation of [type guards](https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards) helping us to distinguish different HTTP events. This way we can access event-specific fields in a type-safe way.

We'll focus on the events [HttpResponse](https://angular.io/api/common/http/HttpResponse) and [HttpProgressEvents](https://angular.io/api/common/http/HttpProgressEvent). They both contain the discriminator field `type` allowing us to easily return a boolean for the type assertion in our guards.

```typescript
import {HttpEvent, HttpEventType, HttpResponse, HttpProgressEvent} from '@angular/common/http'

function isHttpResponse<T>(event: HttpEvent<T>): event is HttpResponse<T> {
  return event.type === HttpEventType.Response
}

function isHttpProgressEvent(event: HttpEvent<unknown>): event is HttpProgressEvent {
  return event.type === HttpEventType.DownloadProgress 
      || event.type === HttpEventType.UploadProgress
}
``` 

The guards can be used with a simple if-statement, however, TypeScript will narrow the event type inside the statement block for us:

```typescript
const event: HttpEvent<Blob> = ...
console.log(event.loaded) // not accessible, possible compilation error
if (isHttpProgressEvent(event)) {
  console.log(event.loaded) // type is narrowed, property is accessible
}
```

Based on these guards we can now create our custom operator. It'll leverage [scan](https://rxjs.dev/api/operators/scan), an operator that allows us to accumulate state for successive values coming through an observable. It takes up to two arguments: First, we provide an `accumulator` function which will compute the next `Download` state from the previous one and the current `HttpEvent`. Second, we'll pass a `seed` to `scan` representing the initial `Download` state.  This `seed` will represent our download being pending without any progress or content:

```typescript
{state: 'PENDING', progress: 0, content: null}
```

Our `accumulator` will use the previously defined guard to update the `Download` state over time with information from the HTTP events:

```typescript
(previous: Download, event: HttpEvent<Blob>): Download => {
  if (isHttpProgressEvent(event)) {
    return {
      progress: event.total
        ? Math.round((100 * event.loaded) / event.total)
        : previous.progress,
      state: 'IN_PROGRESS',
      content: null
    }
  }
  if (isHttpResponse(event)) {
    return {
      progress: 100,
      state: 'DONE',
      content: event.body
    }
  }
  return previous
}
```

When we encounter a `HttpProgressEvent`, we calculate the progress based on the number of bytes already loaded and the total bytes. A download is done when we receive a `HttpResponse` containing the file contents in its body. When receiving any other events than `HttpProgressEvent` or `HttpResponse`, we won't alter the download's state and return it as it is. This way, for example, we can keep the information in the `progress` property while other events that won't allow us to compute the progress can be ignored for now.

Let's finally define our custom operator that's using `scan` with our `accumulator` and `seed`:

```typescript
export function download(
  saver?: (b: Blob) => void
): (source: Observable<HttpEvent<Blob>>) => Observable<Download> {
  return (source: Observable<HttpEvent<Blob>>) =>
    source.pipe(
      scan((previous: Download, event: HttpEvent<Blob>): Download => {
          if (isHttpProgressEvent(event)) {
            return {
              progress: event.total
                ? Math.round((100 * event.loaded) / event.total)
                : previous.progress,
              state: 'IN_PROGRESS',
              content: null
            }
          }
          if (isHttpResponse(event)) {
            if (saver && event.body) {
              saver(event.body)
            }
            return {
              progress: 100,
              state: 'DONE',
              content: event.body
            }
          }
          return previous
        },
        {state: 'PENDING', progress: 0, content: null}
      )
    )
}
```

Notice that this `download` operator accepts an optional parameter `saver`. Once a HTTP response is received, this function is invoked with the download content from inside the `accumulator`. This allows us to pass in a strategy for persisting the download to a file without directly coupling the operator to FileSaver.js.

The service code now looks like this when using the custom operator:

```typescript
import { saveAs } from 'file-saver';
...
download(url: string, filename?: string): Observable<Download<Blob>> {
    return this.http.get(url, {
      reportProgress: true,
      observe: 'events',
      responseType: 'blob'
    }).pipe(download(blob => saveAs(blob, filename)))
}
```

## Decoupling FileSaver.js

By keeping FileSaver.js out of our custom operator, the resulting code is more maintainable. The `download` operator can be tested without somehow mocking the `saveAs` import (see [here](https://github.com/nilsmehlhorn/ngx-operators/blob/5d9c1f24665f6809b48a43db08d6d91afbbc80aa/projects/ngx-operators/src/lib/download.spec.ts) for corresponding tests). If we apply the same pattern to the service, we'll be able to test it just as easy. So let's do that by creating a custom injection token for `saveAs` in a file called `saver.provider.ts`:

```typescript
import { InjectionToken } from '@angular/core'
import { saveAs } from 'file-saver';

export type Saver = (blob: Blob, filename?: string) => void

export const SAVER = new InjectionToken<Saver>('saver')

export function getSaver(): Saver {
  return saveAs;
}
```

Then use the token to register a provider in an Angular module:

```typescript
import {SAVER, getSaver} from './saver.provider'

@NgModule({
  ...
  providers: [
    {provide: SAVER, useFactory: getSaver}
  ]
})
export class AppModule { }
```

Our service can then get the saving method injected and thus experience more loose coupling:

```typescript
@Injectable({providedIn: 'root'})
export class DownloadService {

  constructor(
    private http: HttpClient,
    @Inject(SAVER) private save: Saver
  ) {}

  download(url: string, filename?: string): Observable<Download<Blob>> {
    return this.http.get(url, {
      reportProgress: true,
      observe: 'events',
      responseType: 'blob'
    }).pipe(download(blob => this.save(blob, filename)))
  }
}
```

## Showing a Progress Bar

Let's use the [Progress Bar from Angular Material](https://material.angular.io/components/progress-bar/overview) to show how far along our download is. We'll create a component property for binding a download called `download$`. The component now only has to assign an observable download to this property:

```typescript
@Component({...})
export class MyComponent  {

  download$: Observable<Download<Blob>>

  constructor(private downloads: DownloadService) {}

  download(): void {
    this.download$ = this.downloads.download(
        '/downloads/archive.zip', 
        'archive.zip'
    )
  }
}
```

We can then subscribe to this observable through the [AsyncPipe in combination with NgIf](https://nils-mehlhorn.de/posts/angular-observable-directive). While the download is pending we'll display the progress bar in 'buffer' mode (you may also use 'query'), otherwise the progress is determinate. The bar's value can then easily be applied from `Download`.

```html
<mat-progress-bar *ngIf="download$ | async as download"
		[mode]="download.state == 'PENDING' ? 'buffer' : 'determinate'" 
        [value]="download.progress">
</mat-progress-bar>
```

**Pro Tip**: If you need to map something to more than two values inside a template or rather a ternary statement won't do it for you: [map](https://rxjs-dev.firebaseapp.com/api/operators/map) the observable to the type you need or use a [custom pipe](https://angular.io/guide/pipes#custom-pipes) instead of calling a component function from the template. Both methods are pretty easy to write, more declarative and perform better.

> The `download` operator is available in the **[ngx-operators](https://github.com/nilsmehlhorn/ngx-operators)** library - a collection of battle-tested RxJS operators for Angular.

> As always, if you've got any questions don't hesitate to leave a comment below or ping me on Twitter [@n_mehlhorn](https://twitter.com/n_mehlhorn). You can also follow me there and [join my mailing list](https://nils-mehlhorn.de/newsletter) to see when new articles are coming up and get smaller tips around Angular and web development in general.

Here's a StackBlitz showing everything in action.

<iframe 
style="width: 100%; height: 550px"
src="https://stackblitz.com/edit/angular-file-download-progress?ctl=1&embed=1&view=preview">
</iframe>

