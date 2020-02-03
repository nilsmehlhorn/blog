---
path: "/posts/angular-observable-directive"
date: "2020-02-01"
title: "Handling Observables with Structural Directives in Angular"
published: true
tags: ["web development", "frontend", "angular"]
keywords: ["angularjs", "loading", "directive", "rxjs", "observable"]
banner: "./banner.png"
description: "Here's how you setup and access Angular environments with a proper type for multiple builds and tests with a mock - production-ready and with examples."
---
Handling observables is a much discussed topic in Angular. There are
multiple ways to get reactive values displayed in your template, but
sometimes they all just feel a bit clunky. Let's explore which options
there are, how they work and how we might improve upon them.

## Manual Subscription vs. ngIf with AsyncPipe

Tomas Trajan already wrote a comprehensive article comparing manual
subscriptions and usage of the
[AsyncPipe](https://angular.io/api/common/AsyncPipe) in combination with
[NgIf](https://angular.io/api/common/NgIf).

> [The Ultimate Answer To The Very Common Angular Question: subscribe() vs | async Pipe](https://medium.com/angular-in-depth/angular-question-rxjs-subscribe-vs-async-pipe-in-component-templates-c956c8c0c794)  
> by Tomas Trajan

Let's do a quick recap and have a look behind the scenes.

## Manual Subscription Management

The first option is manually listening for new values from an observable
by registering a callback in `subscribe()`. Below you can see an example
of this. As I've mentioned in my article on
[loading indication in Angular](https://nils-mehlhorn.de/posts/indicating-loading-the-right-way-in-angular),
this is also the only way to handle observables which represent actions
that won't result in something you'll display in your template.
```typescript
@Component(...)
export class UsersComponent implements OnInit, OnDestroy {

    users: User[] = []
  
    private unsubscribe$ = new Subject<void>()

    constructor(private users: UserService) {}
    
    ngOnInit(): void {
      this.users.getAll()
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe(users => {
          this.users = users
        })
    }
    
    ngOnDestroy(): void {
      this.unsubscribe$.next()
      this.unsubscribe$.complete()
    }
}
```
```html
<p>
  There are {{ users.length }} online.
</p>
```

One thing to keep in mind here is that you'll want to unsubscribe from
any pending observable when your component is destroyed. You can do this
most elegantly by using the `takeUntil()` RxJS operator. Have a look at
Ben Lesh's article for more info on that.

> [RxJS: Don’t Unsubscribe](https://medium.com/@benlesh/rxjs-dont-unsubscribe-6753ed4fda87)
> by Ben Lesh

Some people claim that it's unnecessary to unsubscribe from observables
that you're expecting to only emit a single value - like a one-off HTTP
call for example. I'd advise you unsubscribe regardless for two reasons:

1. **RxJS subscriptions are cancellable**. This means that unsubscribing
   from an observable representing a HTTP request will cancel that
   request. When a user changes their mind and closes your component
   after kicking off an action, this action might be nullified as the
   user most likely intended by navigating away.
   
2. **You'll break the contract**. The whole reason for encapsulating
   HTTP requests into services is that your components aren't supposed
   to know where the data is coming from. By unsubscribing even when you
   know that your service is *just* doing one HTTP request right now, you
   won't have to remember changing your component later on when it might
   deliver multiple values over time, e.g. through a web socket or long
   polling.
   
## Deconstructing ngIf and AsyncPipe

The other option for getting reactive data into the view involves
defining the observable in our component and binding it by combining the
NgIf directive and AsyncPipe through the infamous `as` syntax.

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

Besides ending up with less code we get some advantages. Let's have at
look at them one by one and see how they're working.

### No Subscription Management 

This is all taken care of by the AsyncPipe. Looking at it's
[code on GitHub](https://github.com/angular/angular/blob/85b551a38829f90d4b87cd2a6fa506dfdeed2ec9/packages/common/src/pipes/async_pipe.ts)
you can see how it's subscribing to the passed in observable inside
`transform()` and unsubscribing inside `ngOnDestroy()` - basically just
like we did, just wrapped into an Angular pipe.

### OnPush Change Detection

Once you're using the AsyncPipe you can improve performance by
configuring your component to use `OnPush` change detection. This is not
magically tied to the AsyncPipe by itself. The pipe rather triggers
change detection explicitly once a new observable value is coming
through (see lines
[140-145 in its
code](https://github.com/angular/angular/blob/85b551a38829f90d4b87cd2a6fa506dfdeed2ec9/packages/common/src/pipes/async_pipe.ts#L140)).

Currently there's no official documentation on how the `OnPush` change
detection actually works. I don't like to rely on some third-party blog
post for such essential information (and you should neither), so lets
look at some code again - or rather tests thereof. There's a
[designated
test suite for OnPush](https://github.com/angular/angular/blob/9bd959076730c4e22ceadda73694198b4f01b9e0/packages/core/test/acceptance/change_detection_spec.ts#L282)
telling us everything we need to know. In this mode change detection is
running by itself only in three cases:

1. when the component's inputs are reassigned
2. when events occur on the component or one of its children
3. when the component is "dirty", meaning it's explicitly marked for
   change detection through a call to `markForCheck()` on a
   [ChangeDetectorRef](https://angular.io/api/core/ChangeDetectorRef)
   (like it's done in the AsyncPipe)
   
Change detection means that Angular will update the template bindings
with the values from your class. When using the default
ChangeDetectionStrategy this is done in a multitude of cases and not
just those three mentioned above - **this is where the perfomance
improvement is coming from when using OnPush**.

### Rendering the Template or a Fallback

NgIf is what's called a
[structural directive](https://angular.io/guide/structural-directives)
in Angular - "structural", because it's manipulating the DOM:

> Structural directives are responsible for HTML layout. They shape or
> reshape the DOM's structure, typically by adding, removing, or
> manipulating elements.

The asterisk (*) in front of the directive's name tells Angular to
evaluate the assignment using
[microsyntax](https://angular.io/guide/structural-directives#microsyntax).
While that might sound dazzling, it's just a short way of calling
JavaScript setters on the directive instance. Every keyword in a such a
microsyntax expression - like `else` for NgIf - corresponds to a setter
in the directive code. The setter naming follows a pattern starting with
the directive selector followed by the keyword. For `else` it's `set
ngIfElse(templateRef: TemplateRef<NgIfContext<T>>|null)` like you can
see from the
[official sources in line 187](https://github.com/angular/angular/blob/cca26166376d4920f5905b168e70ea2e8d70da77/packages/common/src/directives/ng_if.ts#L187).

There's also a keyword `then` which you could use to
[assign a template
for the truthy branch dynamically](https://angular.io/api/common/NgIf#using-an-external-then-template).
Per default though NgIf will use the tag it's assigned to as a template
for that (see line
[160](https://github.com/angular/angular/blob/cca26166376d4920f5905b168e70ea2e8d70da77/packages/common/src/directives/ng_if.ts#L160)).

Now anytime the underlying observable emits a new value the AsyncPipe
will pass it on to NgIf through our microsyntax expression and trigger
re-evaluation inside of it. The directive will subsequently either add
the `then`-template to the DOM when the expression is truthy and
otherwise add the `else`-template.

The last bit to all of this is the `as` keyword. As it turns out there's
no corresponding setter in the source code of the NgIf directive. That's
because it's not specific to NgIf. Rather it has to do with
`TemplateRef<C>` - which is a type that's referencing a template where
`C` is the template's context declaring all variables available while
rendering the template. For NgIf this type is `NgIfContext<T>` and looks
like this:

```typescript
export class NgIfContext<T> {
  public $implicit: T;
  public ngIf: T;
}
```

We can get a hold of anything that's in such a template context by
declaring a
[template input variable](https://angular.io/guide/structural-directives#template-input-variable)
using the `let` keyword in the patter
`let-<your-var-name>="<context-property>"`. Here's an example for NgIf:

```html
<ng-template [ngIf]="'hello'" let-a="$implicit" let-b="ngIf" let-c>
  <p>a = {{ a }}</p>
  <p>b = {{ b }}</p>
  <p>c = {{ c }}</p>
</ng-template>
```

Here's the
[example in action](https://stackblitz.com/edit/ng-if-as?file=src/app/app.component.html)
showing that actually all variables `a`, `b` and `c` will been assigned
to `'hello'`.

The property `$implicit` in any template context will be assigned to a
template input variable that's not referencing a specific context
property - in this case `c`. This is a handy shortcut so you don't have
to know the specific context of every directive you're using. It also
explains why `a` and `c` get the same values.

In the case of NgIf the context property `ngIf` will also reference the
evaluated condition. Therefore `b` also evaluates to `'hello'`. And
that's also the basis for the `as` keyword. More precisely, Angular will
create a template input variable based on the literal you put after `as`
and assign to it the context property having the same name as the
directive itself. Again, no official documentation on this is available
but there are
[tests](https://github.com/angular/angular/blob/c0f69f324548ed06ecdbd0b4d307f5585f620fe8/packages/compiler/test/template_parser/template_parser_spec.ts#L1581)
locking this functionality in.

## A Structural Directive for Observables

NgIf and the AsyncPipe are a great fit - but it's not a match made in
heaven. It has substantial drawbacks:

* falsy values (`false`, `0`, `''`, `null`, `undefined`) emitted by our
  observable will result in the `else`-template being displayed - this
  is because NgIf doesn't know about observables and will plainly
  evaluated what's passed to it by the AsyncPipe
* we can only capture one value with NgIf and thus can't access errors
  emitted by our observable
* the same template reference is used for when the observable is still
  loading and for when it has errored because both will trigger the
  `else`-template of NgIf

As we've now seen there's no magic to any of these parts - nothing we
couldn't implement ourselves. So let's come up with something that's
specifically suited for rendering observables in templates and then
explore it step-by-step:


```typescript
import {
  Directive, Input, TemplateRef, ViewContainerRef,
  OnDestroy, OnInit, ChangeDetectorRef
} from '@angular/core'
import { Observable, Subject, AsyncSubject } from "rxjs";
import { takeUntil, concatMap, finalize } from "rxjs/operators";

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
      concatMap(() => source),
      takeUntil(this.unsubscribe),
      finalize(() => this.changes.detectChanges())
    ).subscribe(v => {
      this.view.clear()
      this.view.createEmbeddedView(this.nextRef, {$implicit: v, observe: v})
    }, e => {
      if (this.errorRef) {
       this.view.clear()
       this.view.createEmbeddedView(this.errorRef, {$implicit: e})
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

Let's also have an example showing it's usage so we can see the
connections:

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

Starting at with the constructor we can get a handle on the
[ViewContainerRef](https://angular.io/api/core/ViewContainerRef). This
will allow us to manipulate the DOM by rendering templates in place of
our directive.

Angular will also provide us with a reference to the tag's template on
which we've put `*observe`. In our example that's the `p` tag binding
the observables value. We can call it `nextRef` (as it's for displaying
the _next_ observable value) and type its context very similar to how
it's done for NgIf. `ObserveContext` will be typed generically upon the
underlying observable and provide its value to an implicit template
input variable or through the `as` keyword (because there's a context
property called just like our directive).

We'll also inject a `ChangeDetectorRef` so that our directive can work
with `OnPush` change detection.

The setters `observeError` and `observeBefore` are following the
microsyntax naming and can be used to pass templates for being displayed
_before_ the observable has emitted a value (so basically while loading)
and for when the observable has an error. 

In the first case we can't
provide a meaningful context, that's why the `TemplateRef` has a generic
parameter of `null`. We'll render this template without a context by
calling `view.createEmbeddedView()` just with the template as you can
see in `showBefore()`. There we'll also make sure to first `clear()` the
view - otherwise we might end up with multiple templates rendered.

In case of an error we can provide a context containing the actual error
in the aforementioned `$implicit` property. We'll create a type for this
specific context called `ErrorContext` and use it to narrow the
corresponding `TemplateRef`. This allows us to define the template input
variable `let-error` in our example.

The `AsyncSubject<void>` called `init` is just an observable wrapper
around the
[OnInit hook](https://angular.io/guide/lifecycle-hooks#oninit). Once we
let it complete from inside `ngOnInit()` it'll always emit upon
subscription. This will prevent us from rendering any template too
early.

The `observe` setter is where things get interesting. It's the main
setter for our directive and in our example it's receiving the `users$`
observable. When such a `source` is passed in, any prior subscriptions
are cancelled via `this.unsubscribe.next(true) in combination with the
`takeUntil` operator - very similar to how we've been cancelling
subscriptions upon `ngOnDestroy()`.



[StackBlitz](https://stackblitz.com/edit/angular-observe-directive)
