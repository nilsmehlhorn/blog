---
path: "/posts/angular-download-progress"
date: "2020-03-03"
title: "Angular File Download with Progress"
published: true
banner: "./angular-download-progress.png"
tags: ["web development", "frontend", "angular"]
keywords: ["angular download link", "rxjs", "download progress bar", "loading", "observable"]
description: "NgIf and the AsyncPipe are great for handling observables in Angular but we can build a structural directive that's even better."
---

Downloading files is a common task for web applications. This could be some PDF, ZIP or any other binary or text-based file that you want to make accessible to your users. Here's how you can download files in Angular either with a rather simple link or JavaScript-based for more control and progress indication.

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

This approach is pretty verbose though and might not work smoothly for every browser. Therefore I'd advise you to use the popular library [FileSaver.js](https://github.com/eligrey/FileSaver.js/) for saving blobs. The saving then becomes a one-liner:
```typescript
import { saveAs } from 'file-saver';

download() {
    this.downloads
      .download('/downloads/archive.zip')
      .subscribe(blob => saveAs(blob, 'archive.zip'))
}
```

_If you're still going to use the manual approach shown before, you might as well refactor the code for saving the blob into a separate service. There you probably want to inject `document` with Angular's built-in injection token [DOCUMENT](https://angular.io/api/common/DOCUMENT). You can also [create a custom injection token](https://angular.io/guide/dependency-injection-in-action#supply-a-custom-provider-with-inject) for `URL`._

## Calculating the Download Progress

By adding setting the option `observe` to `events` while making an HTTP request, we won't just receive the final response body of the request but also get access to intermediate HTTP events. There are multiple kinds of HTTP events in Angular all consolidated under the type [HttpEvent](https://angular.io/api/common/http/HttpEvent). We also need to explicitly pass the option `reportProgress` in order to receive [HttpProgressEvents](https://angular.io/api/common/http/HttpProgressEvent). Our HTTP request will eventually look like follows:

```typescript
this.http.get(url, {
  reportProgress: true,
  observe: 'events',
  responseType: 'blob'
})
```

Since we don't just want to forward these events to every component, our service has to do some more work. Otherwise our component would have to deal with HTTP specifics - that's what services are for! Instead let's introduce a data structure representing a download with progress:

```typescript
export interface Download<T> {
  content?: T
  progress: number
  state: 'PENDING' | 'IN_PROGRESS' | 'DONE'
}
```

A `Download` has the content-type `T` which will be `Blob` most of the time - still, you could also download any other kind of data like some JSON string. It has a number indicating the download progress from 1 to 100. Finally, a download can be in one of three states. Either it hasn't started yet, therefore it's pending. Otherwise it's done or still in progress. We use [TypeScript's union types](https://www.typescriptlang.org/docs/handbook/advanced-types.html#union-types) to define the different download states.

Now we'll create a function that is able to transform HTTP events into our newly defined data structure. The first step for this will be the creation of [type guards](https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards) helping us to distinguish different HTTP events. We'll focus on the events [HttpResponse](https://angular.io/api/common/http/HttpResponse) and [HttpProgressEvents](https://angular.io/api/common/http/HttpProgressEvent). They both contain the discriminator field `type` allowing us to easily return a boolean for the type assertion in our guards.

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

Based on these guards we can now create the transformation function in a type-safe manner:

```typescript
export function toDownload<T>(event: HttpEvent<T>): Download<T> {
  if (isHttpProgressEvent(event)) {
    return {
      progress: Math.round(100 * event.loaded / event.total),
      state: 'IN_PROGRESS'
    }
  }
  if (isHttpResponse(event)) {
    return {
      progress: 100,
      state: 'DONE',
      content: event.body
    }
  }
  return {progress: 0, state: 'PENDING'}
}
```

This function will return a `Download` based on the emitted event. When we encounter a `HttpProgressEvent`, we calculate the progress based on the number of bytes already loaded and the total bytes. A download is done when we receive a `HttpResponse` containing the file contents in its body. While we haven't received a `HttpProgressEvent` or a `HttpResponse`, we'll say that the download is still pending without progress.

The function can now be used inside `DownloadService`. There we can pass it to the RxJS operator [map](https://rxjs-dev.firebaseapp.com/api/operators/map). 

```typescript
download(url: string, filename?: string): Observable<Download<Blob>> {
    return this.http.get(url, {
      reportProgress: true,
      observe: 'events',
      responseType: 'blob'
    }).pipe(map(toDownload))
}
```

Let's also spare components of the manual save call by saving the download once it's done. We do this with a custom RxJS operator where we combine our mapping with the [tap](https://rxjs-dev.firebaseapp.com/api/operators/tap) operator. This operator will be invoked for any `Download` that's passing by. Once a download is done, we'll use FileSaver.js to save its contents. We'll also manage a `saved` flag to prevent duplicate saves.

```typescript
export function download(filename?: string): (source: Observable<HttpEvent<Blob>>) => Observable<Download<Blob>> {
  let saved = false;
  return (source: Observable<HttpEvent<Blob>>) => source.pipe(
    map(toDownload),
    tap(download => {
      if (download.state === 'DONE' && !saved) {
        saveAs(download.content, filename)
        saved = true
      }
    })
  )
}
```

The service code now looks like this when using the custom operator:

```typescript
download(url: string, filename?: string): Observable<Download<Blob>> {
    return this.http.get(url, {
      reportProgress: true,
      observe: 'events',
      responseType: 'blob'
    }).pipe(download(filename))
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

Here's a StackBlitz showing everything in action.

> As always, if you've got any questions don't hesitate to leave a comment below or ping me on Twitter [@n_mehlhorn](https://twitter.com/n_mehlhorn). You can also follow me there and [join my mailing list](https://nils-mehlhorn.de/newsletter) to see when new articles are coming up and get smaller tips around Angular and web development in general.


<iframe 
style="width: 100%; height: 550px"
src="https://stackblitz.com/edit/angular-file-download-progress?ctl=1&embed=1&view=preview">
</iframe>

