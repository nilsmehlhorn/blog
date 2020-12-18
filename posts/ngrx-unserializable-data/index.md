---
path: '/posts/ngrx-store-unserializable-data'
date: '2020-12-18'
title: 'How to Handle Unserializable Data with NgRx'
published: true
tags: ['web development', 'frontend', 'angular']
keywords: ['angular', 'ngrx', 'store', 'redux', 'rxjs', 'observable']
banner: './ngrx-unserializable-data-banner.jpg'
description: "Here's why serializability is important and how to handle unserializable data when managing state with NgRx in Angular"
---

```toc

```

A fundamental aspect of managing state with NgRx is that all state data needs to be serializable. Runtime state objects are serializable when they can be predictably saved to a persistent storage or transferred over network. In practice, JavaScript objects are mostly serialized to JSON and eventually we'll want our NgRx state to be almost identical to its JSON representation. This way, state can easily be serialized with [`JSON.stringify()`](https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify) and de-serialized with [`JSON.parse()`](https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse) without errors or loss of information. Effectively, the result of `JSON.parse(JSON.stringify(state))` should be equal to the state itself.

In addition to keeping the state inside the NgRx store serializable, the same considerations also apply for actions and their payloads. Serialiazibilty then enables the use of things like the [Redux DevTools](https://github.com/reduxjs/redux-devtools) or [persisting NgRx state to the local storage](https://nils-mehlhorn.de/posts/ngrx-keep-state-refresh). On top of that, it works well with other functional programming concepts embraced by NgRx like immutability or separation of logic and data.

[[book]]
| **[📕 I've written a book on NgRx.](https://gumroad.com/l/angular-ngrx-book)** Learn how to structure your state, write testable reducers and work with actions and effects from one well-crafted resource.

NgRx provides certain [runtime checks](https://ngrx.io/guide/store/configuration/runtime-checks) for verifying that your state and actions are serialiazble. However, per default these aren't turned on and you'll probably only notice problems with serializiblity once you run into bugs. Therefore it's advisable to activate the corresponding runtime checks for [`strictStateSerializability`](https://ngrx.io/guide/store/configuration/runtime-checks#strictstateserializability) and [`strictActionSerializability`](https://ngrx.io/guide/store/configuration/runtime-checks#strictactionserializability) - actually it's probably best to activate all available checks while you're at it. This can be done by passing a second configuration parameter to the [`StoreModule`](https://ngrx.io/api/store/StoreModule) during reducer registration:

```typescript
@NgModule({
  imports: [
    StoreModule.forRoot(reducers, {
      runtimeChecks: {
        strictStateSerializability: true,
        strictActionSerializability: true,
        /* other checks */
      },
    }),
  ],
})
export class AppModule {}
```

Now, once you dispatch an action that is not fully serializable, you'll get the following error:

```
Error: Detected unserializable action at "[path to unserializable property in action]"
```

If any unserializable data makes it into your state, the error message will look like this:

```
Error: Detected unserializable state at "[path to unserializable property in state]"
```

These errors tell us exactly what's wrong, so let's figure out how to fix it.

## What is Serializable and What's Not?

First off, here's a list of types that are generally deemed serializable by NgRx and which can therefore be safely stored in the state - note that I'm referring to the JavaScript runtime types:

- [`String`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
- [`Number`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)
- [`Boolean`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)
- [`Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)
- [`Object`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)
- [`undefined`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined) or [`null`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/null)

In contrast, you do not want these types or similar in your state:

- [`Date`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date), [`Map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map), [`Set`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set),
- [`Function`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function)
- [`Observable`](https://rxjs.dev/guide/observable) or [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [`ArrayBuffer`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer) or [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob/Blob)
- [`HTMLElement`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement)
- [`window`](https://developer.mozilla.org/en-US/docs/Web/API/Window) and similar

While it's not strictly forbidden, you'll also want to avoid classes as their prototype chain can't be restored from JSON. Other than that, classes often tempt you to put functions into the state. Moreover, no classes and/or functions also means that observables shouldn't got into the state.

## Serializable Replacements

Some types have good serializable replacements. So you can just use these while maybe accepting little trade-offs here and there.

### Map: Object

A [`Map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) is almost identical to a regular object - both implement a key-value store. Although they have a different API and there are some subtle differences (e.g. objects only accepts plain keys while maps work with any type of key), it's pretty straightforward to replace maps with regular objects in most cases. You can ensure type safety with [index types](https://www.typescriptlang.org/docs/handbook/interfaces.html#indexable-types) or leverage TypeScript's [`Record<Keys, Type>`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeystype).

Apart from not being serializable, maps are also not immutable. You mutate them by calling methods like `set()` or `delete()`. Leveraging objects and the [spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax) is therefore definitely the better choice.

```diff
interface Todo {
  id: number
  text: string
  done: boolean
}

interface State {
-  todos: Map<number, Todo>
+  todos: {[id: number]: Todo}
}

const initialState = {
-  todos: new Map<number, User>()
+  todos: {}
}

const reducer = createReducer(initialState,
  on(addTodo, (state, { todo }) => {
-   state.todos.set(todo.id, todo)
+   return {
+      ...state,
+      todos: {...state.todos, [todo.id]: todo}
+   }
  })
);
```

### Set: Array

A [`Set`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set) on the other hand is not identical to a plain array list since sets won’t accept duplicate entries. You can either prevent duplicates with additional checks or still work with a set but convert back to an array before placing it in the state.

Like maps, sets are also generally not immutable, so there's again two reasons to avoid them.

```diff
interface State {
-  selected: Set<number>
+  selected: number[]
}

const initialState = {
-  selected: new Set<number>()
+  selected: []
}

const reducer = createReducer(initialState,
  on(selectTodo, (state, { id }) => {
-   state.selected.add(id)
+   return {
+     ...state,
+     selected: state.selected.includes(id) ? state.selected : [...state.selected, id]
+   }
+   // OR
+   return {
+     ...state,
+     selected: Array.from(new Set([...state.selected, id]))
+   }
  })
);
```

### Date: String or Number

There are two options for serializing a date: either converting it to an ISO string with [`toJSON()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toJSON) (which calls [`toISOString()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString) under the hood) or using [`getTime()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTime) to get an epoch timestamp in milliseconds.

While you'll lose the date class functionality in both cases, this isn't really a loss because it's inherently mutable anyway. Meanwhile, the Angular [`DatePipe`](https://angular.io/api/common/DatePipe) directly accepts ISO strings or timestamp numbers. If you still need to transform dates, checkout [date-fns](https://date-fns.org/) for an immutable option.

```diff
const scheduleTodo = createAction(
  '[Todo] Schedule',
  props<{
    id: number
-    due: Date
+    due: string
  }>()
)

function schedule(id: number, date: Date) {
  this.store.dispatch(
    scheduleTodo({
      id,
-      due: date,
+      due: date.toJSON(),
    })
  )
}
```

### Class: Object

As I've said, a class's prototype chain will get lost during serialization. However, usually the prototype contains instance methods which don't really fit the picture anyway when we're working with NgRx because that means we're embracing immutability. But we can replace class instances with regular objects and ensure type safety through interfaces or type aliases.

Meanwhile we convert class methods into either reducer logic or external functions depending on what they do. Instance methods which would change the inner state of a class instance should become (immutable) reducer logic because that's where we update state in NgRx. On the other hand, when a class method only exists to derive information, we put it's code into a separate function. Such a function could then be used in a selector to derive a view model.

Heres' an example with before and after:

```typescript
class Todo {
  private id: string
  private text: string
  private done: boolean

  changeText(text: string): void {
    this.text = text
  }

  getDescription(): string {
    return `[ToDo: ${this.id}]: ${this.text} (${this.done ? 'done' : 'doing'})`
  }
}
```

```typescript
interface Todo {
  id: string
  text: string
  done: boolean
}

const reducer = createReducer(
  initialState,
  on(changeText, (state, { id, text }) => {
    const todo = state.todos[id]
    return {
      ...state,
      todos: {
        ...state.todos,
        [id]: {
          ...todo,
          text,
        },
      },
    }
  })
)

function getDescription(todo: Todo): string {
  return `[ToDo: ${todo.id}]: ${todo.text} (${todo.done ? 'done' : 'doing'})`
}
```

[[info]]
| Join my [mailing list](https://nils-mehlhorn.de/newsletter) and follow me on Twitter [@n_mehlhorn](https://twitter.com/n_mehlhorn) for more in-depth content

## Outsourcing Non-Serializable Data

Some types don't really have a direct replacement which would be serializable. In that case we need workarounds in order to keep them out of the store. This part is usually a bit more tricky as solutions are specific to each use-case, but there's always at least one solution.

### Function

We already outsourced some functions while replacing classes with regular objects. You can apply the same approach for any other functions you've got floating around and invoke them where necessary. That might be from inside a component, service, selector, effect or similar. The function should be placed according to it's logic. So, something like `getDescription()` from before could belong next to the model, other operations might be better served as a service method.

### Observable

Don't put observables into your store. Instead, let observables interact with your state through actions emitted by effects. Selectors then allow you to pull everything together:

```typescript
interface Todo {
  id: number
  text: string
  done: boolean
  comments?: string[]
  // don't add something like this
  comments$: Observable<string[]>
}

interface State {
  todos: { [id: number]: Todo }
}

const selectTodo = createSelector(
  (state: State) => state.todos,
  (todos, id: string) => todos[id]
)

const loadComments = createAction(
  '[Todo] Load Comments',
  props<{ id: string }>()
)
const loadCommentsSuccess = createAction(
  '[Todo] Load Comments Success',
  props<{ id: string; comments: string[] }>()
)

const reducer = createReducer(
  initialState,
  on(loadCommentsSuccess, (state, { id, comments }) => {
    const todo = state.todos[id]
    return {
      ...state,
      todos: {
        ...state.todos,
        [id]: {
          ...todo,
          comments,
        },
      },
    }
  })
)

@Injectable()
class CommentEffects {
  comments$ = createEffect(() =>
    this.action$.pipe(
      ofType(loadComments),
      mergeMap(({ id }) =>
        this.http.get<string[]>(`/todos/${id}/comments`)
      ).pipe(map((comments) => loadCommentsSuccess({ id, comments })))
    )
  )

  constructor(private action$: Actions, private http: HttpClient) {}
}

@Component()
class TodoDetailComponent {
  todo$: Observable<Todo>

  constructor(private route: ActivatedRoute, private store: Store) {}

  ngOnInit() {
    this.todo$ = this.route.params.pipe(
      tap(({ id }) => this.store.dispatch(loadComments({ id }))),
      switchMap(({ id }) => this.store.select(selectTodo, id))
    )
  }
}
```

If you don't want to have additional data in your store or the respective observable is not relevant to the state, you can still outsource it - e.g. into a selection:

```typescript
interface Todo {
  id: number
  text: string
  done: boolean
  comments?: string[]
}

interface State {
  todos: { [id: number]: Todo }
}

const selectTodo = createSelector(
  (state: State) => state.todos,
  (todos, id: string) => todos[id]
)

@Component()
class TodoDetailComponent {
  todo$: Observable<Todo>

  constructor(
    private route: ActivatedRoute,
    private store: Store,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.todo$ = this.route.params.pipe(
      switchMap(({ id }) =>
        combineLatest([
          this.store.select(selectTodo, id),
          this.http.get<string[]>(`/todos/${id}/comments`),
        ])
      ),
      map(([todo, comments]) => ({ ...todo, comments }))
    )
  }
}
```

The same considerations apply for promises.

### Special Objects

Special objects like HTML elements or blobs don't have serializable counterparts or serializing (and constantly de-serializing) them would hurt your application performance. However, you might still want to associate these objects with data in you store. In that case you can leverage additional stateful services.

```typescript
interface Images {
  [id: number]: HTMLImageElement
}

class ImageService {
  private images = new BehaviorSubject<Images>({})

  setImage(id: number, image: HTMLImageElement): void {
    const last = this.images.getValue()
    const next = { ...last, [id]: image }
    this.images.next(next)
  }

  getImage(id: number): Observable<HTMLImageElement> {
    return this.images.pipe(map((images) => images[id]))
  }
}

interface TodoWithImage extends Todo {
  image: HTMLImageElement
}

@Component()
class TodoDetailComponent {
  todo$: Observable<TodoWithImage>

  constructor(
    private route: ActivatedRoute,
    private store: Store,
    private images: ImageService
  ) {}

  ngOnInit() {
    this.todo$ = this.route.params.pipe(
      switchMap(({ id }) =>
        combineLatest([
          this.store.select(selectTodo, id),
          this.images.getImage(id),
        ])
      ),
      map(([todo, image]) => ({ ...todo, image }))
    )
  }
}
```

You'd have to populate such a service through effects while making sure that any associated resources are cleaned up when the corresponding data is removed from the store.

## Conclusion

Serializibility is an important aspect when managing state with NgRx. While it requires us to deviate from certain types, there's a serializable replacement or at least a feasible workaround for every case. If your specific use-case is not covered, drop me a comment and we'll add it.

[[book]]
| **[📕 Get the NgRx book to master all aspects of the Angular state management solution](https://gumroad.com/l/angular-ngrx-book)**
