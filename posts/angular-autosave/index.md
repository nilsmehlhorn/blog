---
path: '/posts/angular-autosave-form-services-ngrx'
date: '2020-06-26'
title: 'Angular Autosave for Forms, Services and NgRx'
published: true
tags: ['web development', 'frontend', 'angular']
keywords: ['rxjs', 'observable', 'ngrx', 'subjects', 'reactive forms', 'user experience']
description: "Saving changes automatically to the server improves user-experience. Let's implement autosave with Angular and RxJS for forms, subject services and NgRx"
banner: './autosave-bank-symbol-image.jpg'
---

```toc
```

Saving a user's changes automatically improves user-experience by preventing data loss. Let's see how we can implement autosave behaviors with Angular.


## Autosave vs. Caching

I'm referring to autosave as automatically storing a serialization of user input data on the server-side or at least somewhat persistently outside of Angular - e.g. in [LocalStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) or [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API).

If you'd just like to cache the state of input fields between in-app navigations, you might already be fine with implementing a custom [RouteReuseStrategy](https://angular.io/api/router/RouteReuseStrategy) in order to [re-use component state](https://stackoverflow.com/questions/41280471/how-to-implement-routereusestrategy-shoulddetach-for-specific-routes-in-angular).

Similarly, you can retain component state by binding to a service that outlives the component. This could either be a custom service based [solely on change detection](https://medium.jonasbandi.net/the-most-simple-state-management-solution-for-angular-1d32706e6f1c) or [leveraging RxJS behavior subjects](https://medium.com/@rmcavin/my-favorite-state-management-technique-in-angular-rxjs-behavior-subjects-49f18daa31a7) as well as something like [NgRx store](https://ngrx.io/guide/store).

## Form Autosave

Let's see how we can actually autosave forms in Angular. Since the framework leverages RxJS we're already in a pretty good situation to reactively save data upon value changes.

When you're using [reactive forms](https://angular.io/guide/reactive-forms), any [AbstractControl](https://angular.io/api/forms/AbstractControl) (e.g. a [FormGroup](https://angular.io/api/forms/FormGroup) or single [FormControl](https://angular.io/api/forms/FormControl)) will expose an observable property `valueChanges`. Sadly, just like any other form API, this observable is still typed as `any` despite emitting the value object of your form. Recently, the [Angular team announced their work on strongly typed forms](https://github.com/angular/angular/issues/13721#issuecomment-637698836), so this might get better soon!

> `valueChanges: Observable<any>`, A multicasting observable that emits an event every time the value of the control changes, in the UI or programmatically -- Angular Documentation

In order to facilitate autosave, you can now easily subscribe to this observable, map the form value to something your server understands, and send off the data. 

**But not so fast**, please don't subscribe manually from inside a subscription callback. This is error-prone and might not yield the result you're looking for. Instead, let's choose the proper [RxJS operators](https://rxjs-dev.firebaseapp.com/guide/operators) for your intended autosave behavior.

```typescript
@Component({...})
export class MyComponent implements OnInit, OnDestroy {

    form: FormGroup

    private unsubscribe = new Subject<void>()

    constructor(private service: MyService) {}

    ngOnInit() {
        this.form = /* create reactive form */;
        this.form.valueChanges.pipe(
            switchMap(formValue => service.save(formValue)),
            takeUntil(this.unsubscribe)
        ).subscribe(() => console.log('Saved'))
    }

    ngOnDestroy() {
        this.unsubscribe.next()
    }
}
```

In the snippet above, every change to the form will trigger a save call. Yet, due to the use of [switchMap](https://rxjs-dev.firebaseapp.com/api/operators/switchMap), only the most recent save call will be active at one point in time. Subsequent value changes will cancel prior save calls when these haven't completed yet.

We could replace switchMap with [mergeMap](https://rxjs-dev.firebaseapp.com/api/operators/mergeMap) and thus have all created autosave requests run simultaneously. Similarly, we might use [concatMap](https://rxjs-dev.firebaseapp.com/api/operators/mergeMap) to execute the save calls one after another. Another option might be [exhaustMap](https://rxjs-dev.firebaseapp.com/api/operators/exhaustMap) which would ignore value changes until the current save call is done.

Either way, since we're dealing with a long-lived observable (meaning it doesn't just emit one time but indefinitely), we should unsubscribe from the stream once the component encapsulating our form is destroyed. In the snippet above I'm doing this with the [takeUntil](https://rxjs-dev.firebaseapp.com/api/operators/debounceTime) operator.

What I'd like to do is save only the most recent version of the form while throttling value changes using the [debounceTime](https://rxjs-dev.firebaseapp.com/api/operators/debounceTime) operator. Debouncing with `500` means that the observable will only start a save call when 500ms passed without further value changes.

```typescript
this.form.valueChanges.pipe(
    debounceTime(500),
    switchMap(formValue => service.save(formValue)),
    takeUntil(this.unsubscribe)
).subscribe(() => console.log('Saved'))
```

If you'd like to run a save periodically while the user is constantly inputting data, you can instead use the [auditTime](https://rxjs.dev/api/operators/auditTime) or [throttleTime](https://www.learnrxjs.io/learn-rxjs/operators/filtering/throttletime) operator.

[[info]]
| Join my [mailing list](https://nils-mehlhorn.de/newsletter) and follow me on Twitter [@n_mehlhorn](https://twitter.com/n_mehlhorn) for more in-depth Angular & RxJS knowledge

## Autosave for Subject Services

When you're handling state through any kind of RxJS subject in a service, you can apply the same principle. Just pipe the subject using the operator combination that fits the behavior you want to achieve. 

The following service will autosave any setting changes periodically after 1s while they occur thanks to [auditTime](https://rxjs.dev/api/operators/auditTime). The [concatMap](https://rxjs-dev.firebaseapp.com/api/operators/mergeMap) operator makes sure that none of the save requests are cancelled while keeping them in chronological order.

```typescript
export interface Settings {
    darkMode: boolean
}

export class SettingsService implements OnDestroy {

    private unsubscribe = new Subject<void>()

    private settings = new BehaviorSubject<Settings>({darkMode: false})

    public settings$ = this.settings.asObservable()

    constructor(private service: MyService) {
        this.settings.pipe(
            auditTime(1000),
            concatMap(settings => service.save(settings)),
            takeUntil(this.unsubscribe)
        ).subscribe(() => console.log('Saved'))
    }

    setDarkMode(darkMode: boolean) {
        this.settings.next({...this.settings.getValue(), darkMode})
    }

    ngOnDestroy() {
        this.unsubscribe.next()
    }
}
```

## NgRx Autosave

When using NgRx, autosave is best implemented as an [effect](https://ngrx.io/guide/effects).

>  Effects are where you handle tasks such as fetching data, long-running tasks that produce multiple events, and other external interactions where your components don't need explicit knowledge of these interactions. -- NgRx Documentation

The specific approach I've chosen for [SceneLab](https://scenelab.io) is to list all actions that modify the state that should be autosaved. We already did something similar to [implement undo-redo](https://nils-mehlhorn.de/posts/angular-undo-redo-ngrx-redux) with [ngrx-wieder](https://github.com/nilsmehlhorn/ngrx-wieder).

```typescript
const STATE_MODIFYING_ACTIONS = [
    addElementSuccess,
    undo,
    redo,
    resizeSelection
    ...
]
```

Then we can create an effect that listens for any of these actions by initializing the [ofType](https://ngrx.io/guide/effects/operators#oftype) operator with the [spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax).

```typescript
autosave$ = createEffect(() => this.actions$.pipe(
    ofType(...STATE_MODIFYING_ACTIONS),
    debounceTime(500),
    map(() => MyActions.save())
))
```

After being debounced, the effect will create a saving action which we will handle in a separate effect. This allows us to easily trigger a save from other places while properly separating concerns. The actual save effect will eventually look very much how you'd write any asynchronous effect for NgRx. I'm also using [withLatestFrom](https://rxjs-dev.firebaseapp.com/api/operators/withLatestFrom) to access the latest state to save.

```typescript
save$ = createEffect(() => this.actions$.pipe(
    ofType(MyActions.save),
    withLatestFrom(this.store)
    switchMap(([action, state]) => this.service.save(state)),
    map(() => MyActions.saveSuccess())
))
```

Note that the save call could produce errors which you might want to [handle differently than NgRx](https://ngrx.io/guide/effects/lifecycle#resubscribe-on-error). By default it will re-subscribe to the effect observable up to 10 times.

[[info]]
| **[📖 I'm writing a book on NgRx and you can get it for free!](https://gumroad.com/l/angular-ngrx-book)** Learn how to structure your state, write testable reducers and work with actions and effects from one well-crafted resource.

Meanwhile, we can also manage a flag in our state indicating to the user that we are currently saving their data.

```typescript
const myReducer = createReducer(initialState,
    on(...STATE_MODIFYING_ACTIONS, state => {
        return {...state, saved: false}
    }),
    on(MyActions.saveSuccess, state => {
        return {...state, saved: true}
    })
)
```

```typescript

@Component({...})
export class MyComponent implements OnInit, OnDestroy {

    saved$ = this.store.select(state => state.saved)

    constructor(private store: Store<State>) {}
}
```

```html
<p *ngIf="saved$ | async; else saving">saved</p>
<ng-template #saving>
    <p>saving...</p>
</ng-template>
```

If you want to get the UX here perfectly right and not display 'saving...' before the user has made any changes, you'll also have to manage a [pristine flag similar to the one from Angular forms](https://angular.io/api/forms/AbstractControl#pristine).

Here's how this looks for SceneLab where the indicator is located in the header:

<figure className={styles.wrapper}>
    <video autoPlay loop>
        <source src="./autosave-user-interface-demo.mp4" type="video/mp4" />
    </video>
    <figcaption>Angular & NgRx autosave demo with <a href="https://scenelab.io">SceneLab</a></figcaption>
</figure>

## HTTP or WebSocket? LocalStorage?

I've been using `service.save(state)` as a placeholder for making the HTTP server request that persists data. However, you might be wondering whether HTTP is the right protocol to use for autosave - so am I. From my perspective, there are two aspects to consider:

- payload size
- request frequency

Since HTTP has a moderate overhead per request, it'd be better fit for _lower_ request frequencies while the payload size can be arbitrarily big. However, you probably want to keep the payload size - just like any serialization efforts - possibly low anyways for good performance.

[Websockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API), on the other hand, open a connection once in order to send only minimal messages after that. Therefore it'd be better for _higher_ request frequencies with smaller payloads. Websockets are especially useful for pushing data from the server to the client e.g. for a chat application. Though, for autosave, we only need to send client data to the server. 

Yet, what are _lower_ and _higher_ request frequencies? I'd argue that with a debounced implementation based on user-changes, the save frequency won't be all that high. Therefore I'd advise you to try out an HTTP-based solution before jumping into a new protocol involving long-lived connections that your servers and proxies need to support - possibly at a certain scale. Make sure though, your server is using [HTTP/2](https://developer.mozilla.org/en-US/docs/Glossary/HTTP_2) to get the most out of it.

For [SceneLab](https://scenelab.io) we went with HTTP while the payload size is usually around a few kilobytes. Try it out in the [app](app.scenelab.io) and see how it feels (you need to be logged-in for autosaving to the server).

As a reference, [Google Docs](https://www.google.de/intl/de/docs/about/) is also sending HTTP POST requests on every single keystroke.

Meanwhile, you might have a use-case where you don't need to send data to the server at all. Maybe it's enough to store the data in [LocalStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) or [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API). That's what we're doing in SceneLab when you're using the app without being logged-in. Once you login, it'll allow you to recover a project you've drafted up before committing to a registration.