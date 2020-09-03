---
path: '/posts/how-ngrx-store-works'
date: '2020-09-05'
title: 'How NgRx Store & Effects Work: 20 LoC Re-Implementation'
published: true
tags: ['web development', 'angular']
keywords: ['angular', 'ngrx', 'store', 'redux', 'rxjs', 'observable']
banner: './how-ngrx-works-banner.jpg'
description: "Let's learn how NgRx works and where it stores data by creating a custom Redux implementation for Angular with a RxJS Behavior Subject."
---

The concepts behind [NgRx](https://ngrx.io/) are inspired by the [Flux](https://facebook.github.io/flux/) architecture and it's most famous implementation: the [Redux](https://redux.js.org/) library. In theory, these concepts aren't too complicated, but in practice it might be hard to wrap your head around how everything fits together. So, let's demystify how NgRx works under the hood by coming up with a custom implementation of NgRx - you'll be surprised with how few lines we can get really close to the real thing. At the same time we'll use our NgRx clone to implement a simple todo app.

Three short [principles](https://redux.js.org/introduction/three-principles#state-is-read-only) are the foundation for NgRx:

**Single Source of Truth**: The application state is stored in one object

**State is Read-Only**: You cannot change the current state, only dispatch an action and produce a new state.

**Changes are made with pure functions**: The next state is produced purely based on the current state and a dispatched action - no side-effects allowed

Together these principles make sure that state transitions are explicit and deterministic, meaning you can easily tell how the application state evolves over time.

TODO: concept image

Our custom NgRx store implementation will be represented by a single file `store.ts` that reflects the Redux principles. Meanwhile, any app using this store can work with the same building blocks that you know from the real library:

**Action**: a plain JavaScript object that references an event occurring in the application. Actions are distinguished by a type but can have arbitrary more properties to serve as a payload containing information about a corresponding event. We can leverage TypeScript's [index types](https://www.typescriptlang.org/docs/handbook/advanced-types.html#index-types) to define an interface representing the action data type:

```typescript
// store.ts
export interface Action {
  type: string
  [property: string]: any
}
```

Now, any object that has a `type` property can be used as an action in our application:

```typescript
const addTodoAction: Action = {
  type: 'ADD',
  text: 'Demystify NgRx',
}
```

We can even create custom action data types and action creators to increase type-safety and ease development. That's basically what the [createAction](https://ngrx.io/api/store/createAction) and [props](https://ngrx.io/api/store/props) functions from NgRx are doing:

```typescript
// todos.actions.ts
export interface AddAction extends Action {
  type: 'ADD'
  text: string
}

export function addTodo(text: string): AddAction {
  return {
    text,
    type: 'ADD',
  }
}

export interface ToggleAction extends Action {
  type: 'ADD'
  todo: Todo
}

export function toggleTodo(todo: Todo): ToggleAction {
  return {
    todo,
    type: 'TOGGLE',
  }
}
```

**State**: a plain JavaScript object that holds the global application state. In an actual application can have many shapes, therefore we'll treat it as a generic type named `S` in our NgRx implementation. We'll use `S` for typing reducers and eventually initializing the store. Meanwhile, the state of our todo app will look like follows. So, for the todo app `State` will take the place of `S` everywhere where we refer to `S` in our custom NgRx implementation:

```typescript
// todos.state.ts
export interface Todo {
  text: string
  done: boolean
}

export interface State {
  todos: Todo[]
}
```

The initial state for the todo app will just contain an empty array:

```typescript
// todos.state.ts
const initialState: State = { todos: [] }
```

**Reducer**: a pure function that takes the current state and an action as parameters while returning the next state. We can convert these claims into a type signature for a reducer using the generic state type `S` and our action interface:

```typescript
// store.ts
export type Reducer<S> = (state: S, action: Action) => S
```

Now, we can define a reducer for our todo app by implementing a function with this type. There we use the [spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax) to produce a new state based on an incoming action. Note that we'll use the initial state as a [default parameter](https://www.typescriptlang.org/docs/handbook/functions.html#optional-and-default-parameters). This way the reducer can be executed once without a state in order to supply the initial state to the store.

```typescript
// todos.reducer.ts
const reducer = (state = initialState, action: Action) => {
  switch (action.type) {
    case 'ADD':
      return {
        todos: [...state.todos, { text: action.text, done: false }],
      }
    case 'TOGGLE':
      return {
        todos: state.todos.map((todo) => {
          if (todo === action.todo) {
            return {
              ...todo,
              done: !todo.done,
            }
          }
          return todo
        }),
      }
    default:
      return state
  }
}
```

Normally, you'd be using the [createReducer]() and [on]() functions to define a reducer. However, under the hood this is not really different from doing a switch-case on the action type. In fact, prior to Angular and NgRx 8 this was the normal way of writing reducers.

## Where Does NgRx Store Data?

NgRx stores the application state in an RxJS observable inside an Angular service called `Store`. At the same time, this service implements the `Observable` interface, forwarding any subscriptions to the underlying observable in order to allow direct subscription calls on the service itself.

Internally, NgRx is actually using a [BehaviorSubject](https://rxjs-dev.firebaseapp.com/api/index/class/BehaviorSubject) which is a special observable that has the following characteristics:

- new subscribers receive the current value upon subscription
- it requires an initial value
- since a BehaviorSubject is in turn a specialized [Subject](https://rxjs-dev.firebaseapp.com/guide/subject) you can emit a new value on it using `subject.next()`
- you can retrieve the current value of BehaviorSubject synchronously using `subject.getValue()`

These characteristics also come in real handy for our custom store implementation where we'll also use a BehaviorSubject to hold the application state. So, let's also create an injectable Angular service `Store` by defining a corresponding class. It'll work with the generic state type `S` and its constructor will accept an application-specific reducer. We compute an initial state by executing the passed-in reducer with `undefined` and an initial action - just like NgRx's [INIT](https://ngrx.io/api/store/INIT) action.

Additionally, we provide a `dispatch` function accepting a single action. This function will retrieve the current state, execute the reducer and emit the resulting state through the BehaviorSubject.

Eventually, the BehaviorSubject is exposed in form of the more restrictive `Observable` type via `asObservable()` so that it's only possibly to cause a new state emission by dispatching an action.

So, here you go, a __NgRx Store re-implementation in less than 20 lines of code__:

```typescript
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs'

@Injectable()
export class Store<S> {
  state$: Observable<S>

  private state: BehaviorSubject<S>

  constructor(private reducer: Reducer<S>) {
    const initialState = reducer(undefined, { type: '@ngrx/store/init' })
    this.state = new BehaviorSubject<S>(initialState)
    this.state$ = this.state.asObservable()
  }

  dispatch(action: Action) {
    const state = this.state.getValue()
    const nextState = this.reducer(state, action)
    this.state.next(nextState)
  }
}
```

Note that the actual NgRx will allow you to register multiple reducers, however, for the sake of simplicity our implementation only accepts a single one. Either way, the approach stays the same: we're managing state through an RxJS BehaviorSubject - a pattern that has been described many times, for example [here](https://medium.com/@rmcavin/my-favorite-state-management-technique-in-angular-rxjs-behavior-subjects-49f18daa31a7) by Rachel Cavin. However, we also make state transitions explicit through actions while keeping each state read-only with pure reducer functions.

In order to use our custom store now for the todo app, we have to register it as a provide while passing an application-specific reducer. This can be done with a [value provider](https://angular.io/guide/dependency-injection-providers#value-providers) as follows. The actual NgRx is doing pretty much the same thing, it's just wrapped in another module.

```typescript
...
import { Store } from './store/store'
import { State } from './store/todos.state'
import { reducer } from './store/todos.reducer'

@NgModule({
  ...
  providers: [
    {provide: Store, useValue: new Store<State>(reducer)}
  ],
  ...
})
export class AppModule { }
```

Then we can use our store almost like the real NgRx store in a component:

```typescript
@Component({...})
export class AppComponent  {

  state$: Observable<State>

  constructor(private store: Store<State>) {
    this.state$ = store.state$
  }

  add(text: string): void {
    this.store.dispatch(addTodo(text))
  }

  toggle(todo: Todo): void {
    this.store.dispatch(toggleTodo(todo))
  }
}
```

```html
<label for="text">Todo</label>
<input #textInput type="text" id="text">
<button (click)="add(textInput.value)">Add</button>
<ul *ngIf="state$ | async as state">
  <li *ngFor="let todo of state.todos">
    <span [class.done]="todo.done">{{ todo.text }}</span>
    <button (click)="toggle(todo)">
      {{ todo.done ? 'X' : '✓'}}
    </button>
  </li>
</ul>
```

## How NgRx Effects Works

- reducers are pure so nothing async like an HTTP request
- but we can dispatch actions at any time
- use rxjs to chain action -> async -> action

## Wrapping up

While it's fun and definitely a good learning experience to implement NgRx yourself, you should definitely stick with the official library for you real Angular apps. This way you can a tested and type-safe implementation with a lot more features.
