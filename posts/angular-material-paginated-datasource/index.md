---
path: "/posts/angular-material-pagination-datasource"
date: "2019-12-19"
title: "Angular Material Pagination Datasource"
published: true
tags: ["web development", "frontend", "angular"]
keywords: ["material", "pagination", "datasource", "filter", "sort", "rxjs", "typescript"]
banner: "./pagination.png"
description: "Build an Angular Material Datasource for pagination and reuse it for filtering and sorting dynamic data"
---

In the course of this article we're developing a reactive datasource for
the
[Angular Material](https://material.angular.io/) library that'll be
reusable for many different paginated endpoints allowing you to
configure search and sorting inputs on a per-instance basis. The final
result is available on
[StackBlitz](https://stackblitz.com/edit/angular-paginated-material-datasource).


> The data source developed in this article is available in the **[ngx-pagination-data-source](https://github.com/nilsmehlhorn/ngx-pagination-data-source)** library 📚   
> I'd appreciate it if you'd give it a star ⭐️ on GitHub, this helps to let people know about it


Although there is a bunch of
[stuff you can do with JavaScript](https://nils-mehlhorn.de/posts/what-you-can-do-with-javascript-today),
on many occasions we're using it to fetch and display some data. In
Angular, the fetching part is mostly done via HTTP while the displaying
part can be performed by a variety of different user-interface
components. This could be a table or a list or a tree-like structure or
whatever else you might require. 

Angular Material offers a couple components that could be used here -
such as the
[table component](https://material.angular.io/components/table/overview).
The creators even anticipated the need to disconnect data retrieval from
data display and are therefore providing us with the concept of a
[DataSource](https://material.angular.io/components/table/overview#advanced-data-sources).

> For most real-world applications, providing the table a DataSource instance will be the best way to manage data. The DataSource is meant to serve a place to encapsulate any sorting, filtering, pagination, and data retrieval logic specific to the application.

Often times the amount of data we'd like to display is too big to be
fetched in one batch. You can get around this by slicing your data and
delivering it through pagination. Users will then be able to navigate
from page to page smoothly. This is something we'll probably need for
many different views that display data - it makes sense to encapsulate
this behaviour so we don't have to write it over and over again.

## Pagination and Sorting Datasource

Let's have a look at a datasource implementation enabling you to sort
data and fetch consecutive pages. First, we'll simplify the Material
datasource a bit:

```typescript
import { DataSource } from '@angular/cdk/collections';
import { Observable } from 'rxjs';

export interface SimpleDataSource<T> extends DataSource<T> {
  connect(): Observable<T[]>;
  disconnect(): void;
}
```

Usually, the methods `connect()` and `disconnect()` would accept a
[CollectionViewer](https://github.com/angular/components/blob/396154413538857811cb0c6bb71e4b4e26ecb320/src/cdk/collections/collection-viewer.ts),
however, it seems ill-advised to have the component displaying the data
also decide which part of the data it's displaying. The official
[datasource for the Material table](https://github.com/angular/components/blob/396154413538857811cb0c6bb71e4b4e26ecb320/src/material/table/table-data-source.ts)
is ignoring the parameter as well.

Next we'll define some reusable types for paginated data in a separate
file called `page.ts`.

```typescript
import { Observable } from 'rxjs';

export interface Sort<T> {
  property: keyof T;
  order: 'asc' | 'desc';
}

export interface PageRequest<T> {
  page: number;
  size: number;
  sort?: Sort<T>;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  size: number;
  number: number;
}

export type PaginationEndpoint<T> = (req: PageRequest<T>) => Observable<Page<T>>
```
The generic parameter `T` always refers to the type of data we're
dealing with - later on in our example it's `User`.

The `Sort<T>` type defines a sorting to be applied (aka. send to the
server) to the data. This sorting could be created
[through the headers of a Material table](https://material.angular.io/components/table/overview#sorting)
or via
[selection](https://material.angular.io/components/select/overview).

A `PageRequest<T>` is what we'll eventually pass to a service which in
turn will kick off a corresponding HTTP request. This service will then
respond with a `Page<T>` containing the requested data.

A `PaginationEndpoint<T>` is a function accepting a `PageRequest<T>` and
returning an RxJS stream aka. observable containing a corresponding
`Page<T>`.

Now we can put these types to use by implementing our paginated
datasource as follows:

```typescript
import { Observable, Subject } from 'rxjs';
import { switchMap, startWith, pluck, shareReplay } from 'rxjs/operators';
import { Page, Sort, PaginationEndpoint } from './page';

export class PaginationDataSource<T> implements SimpleDataSource<T> {
  private pageNumber = new Subject<number>();
  private sort = new Subject<Sort<T>>();

  public page$: Observable<Page<T>>;

  constructor(
    endpoint: PaginationEndpoint<T>,
    initialSort: Sort<T>,
    size = 20) {
      this.page$ = this.sort.pipe(
        startWith(initialSort),
        switchMap(sort => this.pageNumber.pipe(
          startWith(0),
          switchMap(page => endpoint({page, sort, size}))
        )),
        shareReplay(1)
      )
  }

  sortBy(sort: Sort<T>): void {
    this.sort.next(sort);
  }

  fetch(page: number): void {
    this.pageNumber.next(page);
  }

  connect(): Observable<T[]> {
    return this.page$.pipe(pluck('content'));
  }

  disconnect(): void {}

}
```
Let's go through this step-by-step starting at the constructor. It
accepts three parameters: 
* a paginated endpoint which we'll use to fetch pages
* an initial sorting to start with
* an optional size for the pages to fetch, defaulting to 20 items per
  page

We initialize the instance property `sort` with a RxJS subject. By using
a subject we can have the sorting change over time based on calls to the
class method `sortBy(sort: Sort<T>)` which just provides our subject
with the next value. Another subject `pageNumber` is also initialized
during construction allowing us to tell our datasource to fetch
different pages through the method `fetch(page: number)`.

Our datasource will expose a stream of pages through the property
`page$`. We construct this observable stream based on changes to the
sorting. The RxJS operator `startWith()` allows us to easily provide a
starting value for the sorting.

Then, anytime the sorting changes we'll _switch_ over to the stream of
page numbers by leveraging the `switchMap()` operator. Now, as long as
the sorting doesn't change, we'll just be looking at page numbers
starting with the first page of any sorting - again using `startWith()`.

When the datasource is supposed to fetch a different page - triggered by
a call to `fetch(page: number)` - we'll query the paginated endpoint
with the required parameters. Eventually this observable now provides
data pages to possibly multiple consuming components. Therefore you
might use `shareReplay(1)` to synchronize those subscriptions while providing late subscribers with the most recent page.

Finally, inside `connect()` we just provide a stream of lists of items
by mapping any page to its contents using the `pluck()` operator. This
method will eventually be called by the Material table or any other
component compatible with the DataSource interface. You might be
wondering why we don't map our pages directly to just their contents -
that's because we need other page properties like size or number which
can then be used by a
[MatPaginator](https://material.angular.io/components/paginator/overview).

The `disconnect()` method won't have to do anything here - our
datasource will close automatically when all consuming components
unsubscribe.

## Using the Datasource in a Component

Inside a component that is dealing with specific data we can now utilise
our datasource with the Material table. We do this by creating a new
instance and passing a function that'll forward page requests to a
corresponding service. We also pass a default sorting.

The `UserService` will be responsible for converting the
`PageRequest<User>` to a proper HTTP request that is in line with your
server API inside the `page()` method.

```typescript
@Component(...)
export class UsersComponent  {
    displayedColumns = ['id', 'name', 'email', 'registration']

    data = new PaginationDataSource<User>(
      request => this.users.page(request),
      {property: 'username', order: 'desc'}
    )

    constructor(private users: UserService) {}
}
```
Again, in order to now change the sorting you can call
`data.sortBy(sort)` once the user selects a new sorting.

In your template you'll pass the datasource to the Material table or any
other component that can work with this concept. You'll also define a
[MatPaginator](https://material.angular.io/components/paginator/overview)
allowing the user to switch pages. The paginator can also easily consume
the stream of pages from our datasource through the
[AsyncPipe](https://angular.io/api/common/NgIf#storing-a-conditional-result-in-a-variable)
and call upon `data.fetch(page: number)` to get a different page.

```html
<table mat-table [dataSource]="data">
  <ng-container matColumnDef="name">
    <th mat-header-cell *matHeaderCellDef>Username</th>
    <td mat-cell *matCellDef="let user">{{user.username}}</td>
  </ng-container>
  ...
</table>
<mat-paginator *ngIf="data.page$ | async as page"
  [length]="page.totalElements" [pageSize]="page.size"
  [pageIndex]="page.number" [hidePageSize]="true" 
  (page)="data.fetch($event.pageIndex)">
</mat-paginator>
```

## Adding Query Parameters

When there's a lot of data you probably want to assist your users in
finding what they're looking for. You might provide a text-based search
or structured inputs for filtering the data by a certain property. These
query parameters will differ based on the data you're querying. To
compensate for this we'll adapt our datasource to work with a generic
set of query parameters.

First we'll add a generic parameter `Q` to the datasource's type
representing a query model for some data, ending up with the type
`PaginationDataSource<T, Q>`.

We'll then add a constructor parameter for an initial query and create a
subject property with `this.query = new
BehaviourSubject<Q>(initalQuery)`. This type of subject allows us to
access it's last value. We use this characteristic to enable partial
updates to our query through an instance method:

```typescript
queryBy(query: Partial<Q>): void {
    const lastQuery = this.query.getValue();
    const nextQuery = {...lastQuery, ...query};
    this.query.next(nextQuery);
}
```

This method is accepting a
[partial representation](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialt)
of our query model. We combine this new query with the last one by
accessing the `BehaviorSubject<Q>` and merging both queries via the
[spread
operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax).
This way old query properties won't be overridden when only one
parameter is updated.

Then, instead of just basing our observable stream of pages on the sort
subject, we'll _combine_ both changes to sort and query by using the
RxJS operator `combineLatest()`. Both parameter streams are started off
with their initial values - `sort` through `startWith()`, `query`
through the constructor parameter of `BehaviorSubject`.

```typescript
const param$ = combineLatest([
    this.query, 
    this.sort.pipe(startWith(initialSort))
]);
this.page$ = param$.pipe(
    switchMap(([query, sort]) => this.pageNumber.pipe(
      startWith(0),
      switchMap(page => endpoint({page, sort, size}, query))
    )),
    share()
)
```

Subsequently we'll also pass the query to the pagination endpoint.
In order to do this we need to adapt its type like follows:

```typescript
export type PaginationEndpoint<T, Q> = (req: PageRequest<T>, query: Q) => Observable<Page<T>>
```

Now we can update our component to provide some query inputs. First
adapt the initialization of `PaginationDataSource<T, Q>` with a type for
a specific query like `UserQuery`. Then provide a paginated endpoint
that forwards page request and query to `UserService`. And lastly pass
an initial query.

In our example we'll allow users to be searched through
text-based input and a date selection for a user's registration date:

```typescript
interface UserQuery {
  search: string
  registration: Date
}
```
```typescript
data = new PaginationDataSource<User, UserQuery>(
    (request, query) => this.users.page(request, query),
    {property: 'username', order: 'desc'},
    {search: '', registration: undefined}
)
```

Inside the template we can simply forward input values to the datasource
by calling `data.queryBy()` with a partial query model containing the
query parameter:

```html
<mat-form-field>
    <mat-icon matPrefix>search</mat-icon>
    <input #in (input)="data.queryBy({search: in.value})" type="text" matInput placeholder="Search">
</mat-form-field>
<mat-form-field>
    <input (dateChange)="data.queryBy({registration: $event.value})" matInput [matDatepicker]="picker" placeholder="Registration"/>
    <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
    <mat-datepicker #picker></mat-datepicker>
</mat-form-field>
<table mat-table [dataSource]="data">
  ...
</table>
...
```

Now anytime you change the inputs, the displayed page will update
accordingly - provided you properly forwarded the query parameters to
your servers and handle them there correctly.

## Loading Indication

If you like to indicate to the user that you're fetching a page, you can
extend the `PaginationDataSource<T, Q>` with a corresponding observable
property based on a private subject:

```typescript
private loading = new Subject<boolean>();

public loading$ = this.loading.asObservable();
```

Then you can either manually update the subject's value before and after
calling the `PaginationEndpoint<T, Q>` or rather use the operator
`indicate(indicator: Subject<boolean>)` I've introduced in my article
about
[loading indication in Angular](https://nils-mehlhorn.de/posts/indicating-loading-the-right-way-in-angular).
Just attach it to the observable returned by the paginated endpoint and
you're good:

```typescript
this.page$ = param$.pipe(
    switchMap(([query, sort]) => this.pageNumber.pipe(
      startWith(0),
      switchMap(page => this.endpoint({page, sort, size}, query)
        .pipe(indicate(this.loading))
      )
    )),
    share()
)
```

You can then display a loading indicator like this:

```html
<my-loading-indicator *ngIf="data.loading$ | async"></my-loading-indicator>
```

## Wrapping up

Through clever behaviour parameterization we can reuse a bunch of logic
and thus are able to write powerful yet configurable components for
displaying any kind of data. Our extension of the Material datasource
allows us to perform pagination, sorting and filtering of remote data in
just a couple of lines.

Here's the full example on StackBlitz. I've also included a functional
version of the datasource omitting the need for classes.

<iframe 
style="width: 100%; height: 550px"
src="https://stackblitz.com/edit/angular-paginated-material-datasource?ctl=1&embed=1&view=preview">
</iframe>
