---
path: '/posts/how-ngrx-store-works'
date: '2020-09-05'
title: 'How NgRx Store Works in Angular: 20 LoC Re-Implementation'
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

## Where Does NgRx Store Data?

```typescript
import { Observable, BehaviorSubject } from 'rxjs'

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

The actual NgRx will allow you to register multiple reducers, however, for the sake of simplicity our implementation only accepts a single one. Either way, the concept stays the same.

## How NgRx Effects Works

- how ngrx works
- how ngrx store works
- where (does) ngrx store data
- redux
- rxjs
- behavior subject

While it's fun and definitely a good learning experience to implement NgRx yourself, you should definetly stick with the official library for you real Angular apps. This way you can a tested and type-safe implementation with a lot more features.
