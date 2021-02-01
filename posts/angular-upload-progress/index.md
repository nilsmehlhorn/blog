---
path: '/posts/angular-upload-progress'
date: '2021-02-01'
title: 'Angular File Upload with Progress'
published: true
tags: ['web development', 'frontend', 'angular']
keywords:
  [
    'angular download link',
    'rxjs',
    'download progress bar',
    'loading',
    'observable',
  ]
banner: './angular-upload-progress-banner.jpg'
description: 'Upload files like PDF or ZIP in Angular programmatically with the HttpClient so you can show a Material progress bar.'
---

```toc

```

Since my article on [downloading files with Angular](https://nils-mehlhorn.de/posts/angular-file-download-progress) was well received, I've decided to also show how to apply the same pattern for uploads.

Uploading files is again a common interaction with web apps. Whether you want your user to upload documents in the PDF format, some archives as ZIP as well as a profile image or some kind of avatar in form of PNG or JPG - you'll need to implement a file upload and chances are that you also want to display some kind of progress indication.

If you're just here for the plain upload and would rather have a simple on/off loading indication, take a look at my post on [implementing this with Angular and RxJS](https://nils-mehlhorn.de/posts/indicating-loading-the-right-way-in-angular) after the first two sections.

Here's a live example of the file upload dialog and progress bar which we're going to build. You can also find the code on [GitHub](https://github.com/nilsmehlhorn/ng-upload).

<iframe height="400px" width="100%" src="https://repl.it/@nilsmehlhorn/ng-upload?lite=true&outputonly=1" scrolling="no" frameborder="no" allowtransparency="true" allowfullscreen="true" sandbox="allow-forms allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-modals"></iframe>

Tip: You can generate a random big file with OS utilities:

```bash
# Ubuntu
shred -n 1 -s 1M big.pdf
# Mac OS X
mkfile -n 1M big.pdf
# Windows
fsutil file createnew big.pdf 1048576
```

## Angular File Input

First, we need to enable the user to select a file to upload. For this, we use a regular [`<input>` element with `type="file"`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file):

```html
<!-- app.component.html -->
<input type="file" #fileInput (change)="onFileInput(fileInput.files)" />
```

```typescript
// app.component.ts
@Component({
  selector: 'ng-upload-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  file: File | null = null

  onFileInput(files: FileList | null): void {
    if (files) {
      this.file = files.item(0)
    }
  }
}
```

It'll render as a button which opens up a file selection dialog. After a file has been selected, the filename will be displayed next to this button. Note that you may additionally specify a list of accepted file types through the [`accept`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#htmlattrdefaccept) attribute in form of filename extensions or MIME types. You can also allow the selection of multiple files by setting the [`multiple`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#htmlattrdefmultiple) attribute to `true`.

I've bound the input's [change event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/change_event) to a component method while passing the input's [`files`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#files) attribute that contains a [`FileList`](https://developer.mozilla.org/en-US/docs/Web/API/FileList) with one or more selected files. I've done this by assigning a [template reference variable](https://angular.io/guide/template-reference-variables) to the input as it works well with Angular's new strict mode. You might also use the implicit `$event` variable in the event binding and retrieve the [`FileList`](https://developer.mozilla.org/en-US/docs/Web/API/FileList) from the [change event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/change_event).

Unfortunately, it's pretty difficult to style file inputs and [Angular Material also doesn't provide a corresponding component](https://github.com/angular/components/issues/3262). Therefore you might want to hide the actual input element and have it triggered by a button next to it. Here's how that could look with Angular Material and the [`hidden`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/hidden) attribute:

```html
<mat-label>File</mat-label>
<button mat-raised-button (click)="fileInput.click()">
  {{ file ? file.name : 'Select' }}
</button>
<input hidden type="file" #fileInput (change)="onFileInput(fileInput.files)" />
```

Again, I'm using the template reference variable to forward the click for the button to the input element. Since the file is available from the component instance once selected, we can also use it's name as the button text.

## Uploading Files with HttpClient

Now that we can properly select a file, it's time implement the server upload. Of course, it's a prerequisite that you have a server (implemented with the language or framework of your choice) which can accept a file upload request. That means there's an HTTP POST endpoint for sending a body with the `multipart/form-data` content-type. For our example I'm using a Node.js server with Express and the [express-fileupload](https://www.npmjs.com/package/express-fileupload) middleware. The server code looks like this:

```typescript
import * as express from 'express'
import * as fileUpload from 'express-fileupload'

const app = express()

app.use(fileUpload())

app.post('/api/upload', (req, res) => {
  console.log(`Successfully uploaded ${req.files.file.name}`)
  res.sendStatus(200)
})

const server = app.listen(3333, () => {
  console.log(`Listening at http://localhost:3333/api`)
})
```

I'm also [configuring a proxy through the Angular CLI](https://angular.io/guide/build#proxying-to-a-backend-server) so that a request to the Angular development server at `http://localhost:4200/api/upload` will be proxied to the Node.js backend server at `http://localhost:3333/api/upload`.

We'll implement the actual HTTP request on the client-side in an Angular service that depends on the [`HttpClient`](https://angular.io/api/common/http/HttpClient). There we have a method that accepts a file, encodes it into a [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) body and sends it to the server:

```typescript
// upload.service.ts
@Injectable({ providedIn: 'root' })
export class UploadService {
  constructor(private http: HttpClient) {}

  upload(file: File): Observable<void> {
    const data = new FormData()
    data.append('file', file)
    return this.http.post('/api/upload', data)
  }
}
```

Note that the field name `'file'` passed to `append()` is arbitrary. It just needs to correspond with where the server will be looking for the file in the multipart body.

At this point we can add a submit button and method to our component, call the service and trigger the upload by subscribing to the returned observable:

```html
<!-- app.component.html -->
<button
  [disabled]="!file"
  type="submit"
  mat-raised-button
  color="primary"
  (click)="onSubmit()"
>
  Submit
</button>
```

```typescript
// app.component.ts
export class AppComponent implements OnDestroy {
  file: File | null = null

  private subscription: Subscription | undefined

  constructor(private uploads: UploadService) {}

  onFileInput(files: FileList | null): void {
    if (files) {
      this.file = files.item(0)
    }
  }

  onSubmit() {
    if (this.file) {
      this.subscription = this.uploads.upload(this.file).subscribe()
    }
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe()
  }
}
```

## Calculate Upload Progress

In order to calculate the upload progress we need to pass the `reportProgress` and `observe` options for our HTTP request while setting them to `true` and `event` respectively. This way, the [`HttpClient`](https://angular.io/api/common/http/HttpClient) returns and RxJS observable containing an [`HttpEvent`](https://angular.io/api/common/http/HttpEvent) for each step in the upload request. By setting `reportProgress` to `true` this will also include events of type [`HttpProgressEvent`](https://angular.io/api/common/http/HttpProgressEvent) which provide information about the number of uploaded bytes as well as the total number of bytes in the file.

```typescript
// upload.service.ts
import { HttpEvent } from '@angular/common/http'

const data = new FormData()
data.append('file', file)
const upload$: Observable<HttpEvent> = this.http.post('/api/upload', data, {
  reportProgress: true,
  observe: 'events',
})
```

Then we leverage the RxJS operator [`scan`](https://rxjs.dev/api/operators/scan) which can accumulate state from each value emitted by an observable. The resulting observable will always emit the latest calculated state. Our upload state should look as follows:

```typescript
export interface Upload {
  progress: number
  state: 'PENDING' | 'IN_PROGRESS' | 'DONE'
}
```

It has a `progress` property ranging from `0` to `100` and `state` property that tells us whether the underlying request is pending, currently in progress or done. Our initial state will start out accordingly:

```typescript
const initialState: Upload = { state: 'PENDING', progress: 0 }
```

Now we can define how intermediate states are calculated from an existing state and an incoming [`HttpEvent`](https://angular.io/api/common/http/HttpEvent). But first, I'll setup some [user-defined type guards](https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards) for distinguishing different type of events. These guards a functions which narrow the event type based on the `type` property that is available in every event:

```typescript
import {
  HttpEvent,
  HttpEventType,
  HttpResponse,
  HttpProgressEvent,
} from '@angular/common/http'

function isHttpResponse<T>(event: HttpEvent<T>): event is HttpResponse<T> {
  return event.type === HttpEventType.Response
}

function isHttpProgressEvent(
  event: HttpEvent<unknown>
): event is HttpProgressEvent {
  return (
    event.type === HttpEventType.DownloadProgress ||
    event.type === HttpEventType.UploadProgress
  )
}
```

We can then use these guards in if-statements to safely access additional event properties for progress events. Here's the resulting function for calculating the state:

```typescript
const calculateState = (upload: Upload, event: HttpEvent<unknown>): Upload => {
  if (isHttpProgressEvent(event)) {
    return {
      progress: event.total
        ? Math.round((100 * event.loaded) / event.total)
        : upload.progress,
      state: 'IN_PROGRESS',
    }
  }
  if (isHttpResponse(event)) {
    return {
      progress: 100,
      state: 'DONE',
    }
  }
  return upload
}
```

If an [`HttpProgressEvent`](https://angular.io/api/common/http/HttpProgressEvent) is emitted, we'll calculate the current progress and set the state property to `'IN_PROGRESS'`. We do this by returning a new `Upload` state from our state calculation function while incorporating information from the incoming event. On the other hand, once the HTTP request is finished, as indicated by an [`HttpResponse`](https://angular.io/api/common/http/HttpResponse), we can set the `progress` property to `100` and mark the upload as `'DONE'`. For all other events we'll keep (thus return) the state like it is.

Finally, we can pass our `initialState` and the `calculateState` function to the RxJS [`scan`](https://rxjs.dev/api/operators/scan) operator and apply that to the observable returned from the [`HttpClient`](https://angular.io/api/common/http/HttpClient):

```typescript
// upload.service.ts
@Injectable({ providedIn: 'root' })
export class UploadService {
  constructor(private http: HttpClient) {}

  upload(file: File): Observable<Upload> {
    const data = new FormData()
    data.append('file', file)
    const initialState: Upload = { state: 'PENDING', progress: 0 }
    const calculateState = (
      upload: Upload,
      event: HttpEvent<unknown>
    ): Upload => {
      // implementation
    }
    return this.http
      .post('/api/upload', data)
      .pipe(scan(calculateState, initialState))
  }
}
```

Eventually, we get an observable that uploads our file while intermediately informing us about the upload state and thus progress.

## Angular Material Progress Bar

We can use the `Observable<Upload>` returned from the service in our component to display a progress bar. Simply assign the upload states to an instance property from inside the subscription callback (or use the [AsyncPipe with NgIf](https://nils-mehlhorn.de/posts/angular-observable-directive)):

```typescript
// app.component.ts
export class AppComponent implements OnDestroy {
  upload: Upload | undefined

  onSubmit() {
    if (this.file) {
      this.subscription = this.uploads
        .upload(this.file)
        .subscribe((upload) => (this.upload = upload))
    }
  }
}
```

Then you can use this state information in the template to show something like the [Progress Bar from Angular Material](https://material.angular.io/components/progress-bar/overview):

```html
<!-- app.component.html -->
<mat-progress-bar
  *ngIf="upload"
  [mode]="upload.state == 'PENDING' ? 'buffer' : 'determinate'"
  [value]="upload.progress"
>
</mat-progress-bar>
```

## Custom RxJS Upload Operator

At this point everything should work just fine. However, if you'd like to re-use the progress logic in several places you could refactor it into a custom RxJS operator like this:

```typescript
export function upload(): (
  source: Observable<HttpEvent<unknown>>
) => Observable<Upload> {
  const initialState: Upload = { state: 'PENDING', progress: 0 }
  const calculateState = (
    upload: Upload,
    event: HttpEvent<unknown>
  ): Upload => {
    // implementation
  }
  return (source) => source.pipe(scan(reduceState, initialState))
}
```

The `upload` operator is also available in the **[ngx-operators](https://github.com/nilsmehlhorn/ngx-operators)** 📚 library - a collection of battle-tested RxJS operators for Angular. I'd appreciate it if you'd give it a star ⭐️ on GitHub, this helps to let people know about it.

You'd use the operator like this:

```typescript
this.http
  .post('/api/upload', data, {
    reportProgress: true,
    observe: 'events',
  })
  .pipe(upload())
```

## Conclusion

Uploading files is something that's required in many projects. With the presented solution we're able to implement it in a type-safe and re-usable way that works well with the Angular HttpClient and Angular Material. If anything is unclear, don't hesitate to post a comment below or ping me on Twitter [@n_mehlhorn](https://twitter.com/n_mehlhorn).
