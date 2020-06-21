---
path: '/posts/angular-autosave-form-ngrx'
date: '2020-06-24'
title: 'Angular Autosave for Forms and NgRx with RxJS'
published: true
tags: ['web development', 'frontend', 'angular']
keywords: ['rxjs', 'observable']
description: 'Lorem ipsum'
---

Saving a user's changes automatically improves user-experience by preventing data loss. Let's see how we can implement autosave behaviors with Angular.

## Form Autosave

Since Angular leverages RxJS we're already in a pretty good situation to reactively save form data upon value changes.

When you're using [reactive forms](https://angular.io/guide/reactive-forms), any [AbstractControl](ttps://angular.io/api/forms/AbstractContro) (e.g. a [FormGroup](https://angular.io/api/forms/FormGroup) or single [FormControl](https://angular.io/api/forms/FormControl)) will expose an observable property `valueChanges`. Sadly, just like any other form API, this observable is still typed as `any` despite emitting the value object of your form. Recently, the [Angular team announced their work on strongly typed forms](https://github.com/angular/angular/issues/13721#issuecomment-637698836), so this might get better soon!

> `valueChanges: Observable<any>`, A multicasting observable that emits an event every time the value of the control changes, in the UI or programmatically

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

In the snippet above, every change to the form will trigger a save call. Yet, due to the use of [switchMap](https://rxjs-dev.firebaseapp.com/api/operators/switchMap), only the most recent save call will be allowed at one point in time. Subsequent value changes will cancel prior save calls when these haven't completed yet.

We could replace switchMap with [mergeMap](https://rxjs-dev.firebaseapp.com/api/operators/mergeMap) and thus have all created autosave requests run simultaneously. Similarly, we might use [concatMap](https://rxjs-dev.firebaseapp.com/api/operators/mergeMap) to execute the save calls one after another. Another option might be [exhaustMap](https://www.learnrxjs.io/learn-rxjs/operators/transformation/exhaustmap) which would ignore value changes until the current save call is done.

Either way, since we're dealing with a long-lived observable (meaning it doesn't just emit one time but indefinitely), we should unsubscribe from the stream once the component encapsulating our form is destroyed. In the snippet above I'm doing this with the [takeUntil](https://rxjs-dev.firebaseapp.com/api/operators/debounceTime) operator.

What I'd like to do is save only the most recent version of the form while throttling value changes using the [debounceTime](https://rxjs-dev.firebaseapp.com/api/operators/debounceTime) operator.

```typescript
this.form.valueChanges.pipe(
    debounceTime(500),
    switchMap(formValue => service.save(formValue)),
    takeUntil(this.unsubscribe)
).subscribe(() => console.log('Saved'))
```

## NgRx Autosave

## HTTP or WebSocket? Or LocalStorage?

- payload size
- serialization effort
- save frequency
