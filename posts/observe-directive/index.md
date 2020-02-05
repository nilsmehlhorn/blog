---
path: "/posts/angular-observable-directive"
date: "2020-02-05"
title: "Handling Observables with Structural Directives in Angular"
published: true
tags: ["web development", "frontend", "angular"]
keywords: ["ngif", "async", "microsyntax", "loading", "directive", "rxjs", "observable"]
banner: "./banner.png"
description: "NgIf and the AsyncPipe are great for handling observables in Angular but we can build a structural directive that's even better."
---
Handling observables is a much discussed topic in Angular. There are multiple ways to get reactive values displayed in your template, but sometimes they all just feel a bit clunky. Let's explore which options are available, how they work and how we might improve upon them.

There are two main solutions for handling observables that bring data into a component's view:
1. Manual Subscription Management
2. Using the [AsyncPipe](https://angular.io/api/common/AsyncPipe) in combination with [NgIf](https://angular.io/api/common/NgIf).

Tomas Trajan already wrote a comprehensive article comparing both ways, eventually declaring the second one as the winner. 

> [The Ultimate Answer To The Very Common Angular Question: subscribe() vs | async Pipe](https://medium.com/angular-in-depth/angular-question-rxjs-subscribe-vs-async-pipe-in-component-templates-c956c8c0c794)  
> by Tomas Trajan

NgIf and the AsyncPipe are a great fit - but it's not a match made in heaven. It has substantial drawbacks:

* falsy values (`false`, `0`, `''`, `null`, `undefined`) emitted by our   observable will result in the `else`-template being displayed - this   is because NgIf doesn't know about observables and will plainly   evaluated what's passed to it by the AsyncPipe
* we can only capture one value with NgIf and thus can't access errors   emitted by our observable
* the same template reference is used for when the observable is still   loading and for when it has errored because both will trigger the   `else`-template of NgIf

Let's find out how the approach works and how we can improve it further.

   
## Deconstructing ngIf and AsyncPipe

Getting reactive data into the view involves defining the observable in our component and binding it by combining the NgIf directive and AsyncPipe through the famous `as` syntax.

Keep in mind though that you won't be able to use the AsyncPipe when dealing with observables that represent an action - for example when you're updating a user based on a button click.

```typescript
@Component({
  ...
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersComponent {

    users$: Observable<User[]> = this.users.getAll()

    constructor(private users: UserService) {}
}
```
```html
<p *ngIf="users$ | async as users; else loading">
  There are {{ users.length }} online.
</p>
<ng-template #loading>
  <p>Loading ...</p>
</ng-template>
```

Using this method is already a nicely declarative way of handling observables. Let's have a look at its advantages one by one and see how they're working.

### No Subscription Management 

We don't have to unsubscribe since we've never manually subscribed to the `users$` observable. This is all taken care of by the AsyncPipe. Looking at it's [code on GitHub](https://github.com/angular/angular/blob/85b551a38829f90d4b87cd2a6fa506dfdeed2ec9/packages/common/src/pipes/async_pipe.ts) you can see how it's subscribing to the passed in observable inside `transform()` and unsubscribing inside `ngOnDestroy()` - basically just like we would've done by manually calling `subscribe()` and `unsubscribe()` or using the RxJS operator [takeUntil](https://rxjs-dev.firebaseapp.com/api/operators/takeUntil), just wrapped into an Angular pipe.

### OnPush Change Detection

Once you're using the AsyncPipe you can improve performance by configuring your component to use `OnPush` as its [ChangeDetectionStrategy](https://angular.io/api/core/ChangeDetectionStrategy). This is not magically tied to the AsyncPipe by itself. The pipe rather triggers change detection explicitly once a new observable value is coming through (see lines [140-145 in its code](https://github.com/angular/angular/blob/85b551a38829f90d4b87cd2a6fa506dfdeed2ec9/packages/common/src/pipes/async_pipe.ts#L140)).

Currently there's no official documentation on how the `OnPush` change detection actually works. I don't like to rely on some third-party blog post for such essential information (and you should neither), so let's look at some code again - or rather tests thereof. There's a [designated test suite for OnPush](https://github.com/angular/angular/blob/9bd959076730c4e22ceadda73694198b4f01b9e0/packages/core/test/acceptance/change_detection_spec.ts#L282) telling us everything we need to know. In this mode change detection is running by itself only in three cases:

1. when the component's inputs are reassigned
2. when events occur on the component or one of its children
3. when the component is "dirty", meaning it's explicitly marked for    change detection through a call to `markForCheck()` on a    [ChangeDetectorRef](https://angular.io/api/core/ChangeDetectorRef)    (like it's done in the AsyncPipe)
   
Change detection means that Angular will update the template bindings with the values from your component's class instance. When using the default ChangeDetectionStrategy this is done in a multitude of cases and not just those three mentioned above - this is where the perfomance improvement is coming from when using OnPush. 

Updating template bindings often means updating the DOM and that's a relatively costly operation. So when Angular has to do it less often, your application will run more smoothly. On the other hand though you'll have to tell Angular explicitly when changes occur - or rather let the AsyncPipe do it.

### Rendering Templates Conditionally

NgIf is what's called a [structural directive](https://angular.io/guide/structural-directives) in Angular - "structural", because it's manipulating the DOM:

> Structural directives are responsible for HTML layout. They shape or reshape the DOM's structure, typically by adding, removing, or manipulating elements.

The asterisk (*) in front of the directive's name tells Angular to evaluate the assignment using [microsyntax](https://angular.io/guide/structural-directives#microsyntax). While that might sound daunting, it's just a short way of calling JavaScript setters on the directive instance. Every keyword in a such a microsyntax expression - like `else` for NgIf - corresponds to a setter in the directive code. The setter naming obeys a pattern starting with the directive selector followed by the keyword. For `else` it's `set ngIfElse(templateRef: TemplateRef<NgIfContext<T>>|null)` like you can see from the [official sources in line 187](https://github.com/angular/angular/blob/cca26166376d4920f5905b168e70ea2e8d70da77/packages/common/src/directives/ng_if.ts#L187). This setter is accepting a [TemplateRef](https://angular.io/api/core/TemplateRef) which is a reference to a `ng-template` tag. In our example above it's labeled with `#loading`. A structural directive can render template references into the view and conditionally provide a context - more on that soon.

There's also a keyword `then` which you could use to [assign a template for the truthy branch dynamically](https://angular.io/api/common/NgIf#using-an-external-then-template). Per default though NgIf will use the tag it's assigned to as a template for that (see line [160](https://github.com/angular/angular/blob/cca26166376d4920f5905b168e70ea2e8d70da77/packages/common/src/directives/ng_if.ts#L160)).

Now anytime the underlying observable emits a new value the AsyncPipe will pass it on to NgIf through our microsyntax expression and trigger re-evaluation inside of it. The directive will subsequently add the `else`-template while there's no value emitted from the observable (because it's still loading or has errored) or when that value in itself is falsy. The `then`-template will be added when there's a truthy value emitted by the observable. 

The last bit to all of this is the `as` keyword. As it turns out there's no corresponding setter in the source code of the NgIf directive. That's because it's not specific to NgIf - rather it has to do with the context of a template reference. Such a context is a type that's declaring all variables available while rendering the template. For NgIf this type is `NgIfContext<T>` and looks like this:

```typescript
export class NgIfContext<T> {
  public $implicit: T;
  public ngIf: T;
}
```
The generic type `T` is referring to the type you're passing into the directive. So when you're binding `'hello'` it's going to be `string`. When you're passing an `Observable<string>` through an AsyncPipe, the pipe will effectively unwrap the observable and `T` will again be narrowed to `string`. 

We can get a hold of anything that's in such a template context by declaring a [template input variable](https://angular.io/guide/structural-directives#template-input-variable) using the `let` keyword in the pattern `let-<your-var-name>="<context-property>"`. Here's an example for NgIf:

```html
<ng-template [ngIf]="'hello'" let-a="$implicit" let-b="ngIf" let-c>
  <p>a = {{ a }}</p>
  <p>b = {{ b }}</p>
  <p>c = {{ c }}</p>
</ng-template>
<p *ngIf="'hello' as d">
  d = {{ d }}
</p>
```

Here's the [example in action](https://stackblitz.com/edit/ng-if-as?file=src/app/app.component.html) showing that actually all variables `a`, `b`, `c` and `d` will been assigned to `'hello'`.

The property `$implicit` in any template context will be assigned to a template input variable that's not referencing a specific context property - in this case `c`. This is a handy shortcut so you don't have to know the specific context of every directive you're using. It also explains why `a` and `c` get the same values.

In the case of NgIf the context property `ngIf` will also reference the evaluated condition. Therefore `b` also evaluates to `'hello'`. And that's also the basis for the `as` keyword. More precisely, Angular will create a template input variable based on the literal you put after `as` and assign to it the context property having the same name as the directive itself. Again, no official documentation on this is available but there are [tests](https://github.com/angular/angular/blob/c0f69f324548ed06ecdbd0b4d307f5585f620fe8/packages/compiler/test/template_parser/template_parser_spec.ts#L1581) for this functionality.

## A Structural Directive for Observables

As we've now seen there's no magic to any of these parts - nothing we couldn't implement ourselves. So let's come up with something that's specifically suited for rendering observables in templates and then explore it step-by-step:


```typescript
import {
  Directive, Input, TemplateRef, ViewContainerRef,
  OnDestroy, OnInit, ChangeDetectorRef
} from '@angular/core'
import { Observable, Subject, AsyncSubject } from "rxjs";
import { takeUntil, concatMapTo } from "rxjs/operators";

export interface ObserveContext<T> {
  $implicit: T;
  observe: T;
}

export interface ErrorContext {
  $implicit: Error;
}

@Directive({
  selector: "[observe]"
})
export class ObserveDirective<T> implements OnDestroy, OnInit {
  private errorRef: TemplateRef<ErrorContext>;
  private beforeRef: TemplateRef<null>;
  private unsubscribe = new Subject<boolean>();
  private init = new AsyncSubject<void>();

  constructor(
    private view: ViewContainerRef,
    private nextRef: TemplateRef<ObserveContext<T>>,
    private changes: ChangeDetectorRef
  ) {}

  @Input()
  set observe(source: Observable<T>) {
    if (!source) {
      return
    }
    this.showBefore()
    this.unsubscribe.next(true);
    this.init.pipe(
      concatMapTo(source),
      takeUntil(this.unsubscribe)
    ).subscribe(value => {
      this.view.clear()
      this.view.createEmbeddedView(this.nextRef, {$implicit: value, observe: value})
      this.changes.markForCheck()
    }, error => {
      if (this.errorRef) {
       this.view.clear()
       this.view.createEmbeddedView(this.errorRef, {$implicit: error})
       this.changes.markForCheck()
      }
    })
  }

  @Input()
  set observeError(ref: TemplateRef<ErrorContext>) {
    this.errorRef = ref;
  }

  @Input()
  set observeBefore(ref: TemplateRef<null>) {
    this.beforeRef = ref;
  }

  ngOnDestroy() {
    this.unsubscribe.next(true)
  }

  ngOnInit() {
    this.showBefore()
    this.init.next()
    this.init.complete()
  }

  private showBefore(): void {
    if (this.beforeRef) {
      this.view.clear()
      this.view.createEmbeddedView(this.beforeRef)
    }
  }
}
```

Let's also have an example showing it's usage so we can see the connections:

```html
<p *observe="users$ as users; before loadingTemplate; error errorTemplate">
  There are {{ users.length }} online.
</p>
<ng-template #loadingTemplate>
  <p>Loading ...</p>
</ng-template>
<ng-template #errorTemplate let-error>
  <p>{{ error }}</p>
</ng-template>
```

Starting at with the constructor we can get a handle on the [ViewContainerRef](https://angular.io/api/core/ViewContainerRef). This will allow us to manipulate the DOM by rendering templates in place of our directive.

Angular will also provide us with a reference to the tag's template on which we've put `*observe`. In our example that's the `p` tag binding the observables value. We can call it `nextRef` (as it's for displaying the _next_ observable value) and type its context very similar to how it's done for NgIf. `ObserveContext<T>` will be typed generically upon the underlying observable and provide its value to an implicit template input variable or through the `as` keyword (because there's a context property called just like our directive).

We'll also inject a `ChangeDetectorRef` so that we can make our directive work with `OnPush` change detection.

The setters `observeError` and `observeBefore` are following the microsyntax naming and can be used to pass templates for being displayed _before_ the observable has emitted a value (so basically while loading) and for when the observable has an error. 

In the first case we can't provide a meaningful context, that's why the `TemplateRef` for `observeBefore` has a generic parameter of `null`. We'll render this template without a context by calling `view.createEmbeddedView()` just with the template as you can see in `showBefore()`. There we'll also make sure to first `clear()` the view - otherwise we might end up with multiple templates rendered at the same time.

In case of an error we can provide a context containing the actual error in the aforementioned `$implicit` property. We'll create another type for this specific context called `ErrorContext` and use it to narrow the corresponding `TemplateRef` passed into `observeError`. This eventually allows us to define the template input variable `let-error` in our example.

The `AsyncSubject<void>` called `init` is just an observable wrapper around the [OnInit hook](https://angular.io/guide/lifecycle-hooks#oninit). Once we let it complete from inside `ngOnInit()` it'll always emit upon subscription. This will prevent us from rendering any template too early.

The `observe` setter is where things get interesting. It's the main setter for our directive and in our example it's receiving the `users$` observable. When such a `source` is passed in, any prior subscriptions are cancelled via `this.unsubscribe.next(true)` in combination with the `takeUntil` operator - very similar to how you would cancel subscriptions upon `ngOnDestroy()` during manual subscription management. We'll than make sure to wait for `ngOnInit()` by piping off of `init` and then mapping onto the passed in observable using the RxJS operator [concatMapTo](https://rxjs-dev.firebaseapp.com/api/operators/concatMapTo). This operator will wait for the previous observable to complete and then listen to the next one.

Eventually we're subscribing to the underlying observable and anytime a new value comes trough we'll update the view by first clearing it and then creating an embedded view based on our template with a context containing the value. Lastly we'll notify the change detector with `markForCheck()` to support `OnPush` detection. 

When an error occurs we'll do almost the same thing just with the template for displaying errors and only with support for an implicit input variable - provided there is an error template available.

## Conclusion

Our new directive is even better suited for handling observables than NgIf and the AsyncPipe:
* it can display falsy values
* it allows you to define separate templates for loading and errors
* it lets you access errors from inside the error template

I've put together an example on StackBlitz showing the directive in action. I think it's even more useful than NgIf combined with the AsyncPipe in certain situations. In any case we've learned a lot about structural directives and change detection giving us a better understanding of the framework. 

> If you've got any questions don't hesitate to leave a comment below or ping me on Twitter [@n_mehlhorn](https://twitter.com/n_mehlhorn). You can also follow me there or [subscribe to my newsletter](https://nils-mehlhorn.de/newsletter) to see when new articles are coming up and get smaller tips around Angular and web development in general.

<iframe 
style="width: 100%; height: 550px"
src="https://stackblitz.com/edit/angular-observe-directive?ctl=1&embed=1&view=preview">
</iframe>
