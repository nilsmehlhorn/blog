---
title: "Pagination Datasource für Angular Material"
description: "Pagination Datasource für Angular Material mit Unterstützung für Suche, Filterung und Sortierung von dynamischen Daten"
---

In diesem Artikel entwickeln wir eine reaktive Datasource für die [Angular Material](https://material.angular.io/) Bibliothek. Diese Abstraktion erlaubt es uns, Pagination-Logik für verschiedenste Server-Ressourcen wiederzuverwenden. Je nach Anwendungsfall können wir dann passende Eingabemöglichkeiten zur Suche und Sortierung von Daten bereitstellen.

Das finale Ergebnis lässt sich [auf StackBlitz ausprobieren](https://stackblitz.com/edit/angular-paginated-material-datasource). Die DataSource gibt es außerdem als Bibliothek: [ngx-pagination-data-source](https://github.com/nilsmehlhorn/ngx-pagination-data-source) - GitHub-Sterne herzlich willkommen.

Obwohl man mittlerweile [alles mögliche mit JavaScript machen](https://nils-mehlhorn.de/posts/what-you-can-do-with-javascript-today) kann, wird es in vielen Fällen nur genutzt, um Daten vom Server zu holen und diese anzuzeigen. In Angular werden solche Daten meist über HTTP abgerufen, während die Darstellung mithilfe von verschiedensten UI-Komponenten stattfinden kann. Hierzu könnten wir bspw. eine Tabelle, eine Liste oder auch eine Baumstruktur verwenden - je nachdem was benötigt wird.

Angular Material bieter hier bereits einiges passendes an - u.a. eine [Tabellen-Komponente](https://material.angular.io/components/table/overview) im schicken Material Design. Die Entwickler haben bereits Vorarbeit geleistet und bieten uns die Möglichkeit Darstellung und Abruf unserer Daten voneinander zu trennen. Hierzu wird mit dem Konzept einer [DataSource](https://material.angular.io/components/table/overview#advanced-data-sources) gearbeitet.

> For most real-world applications, providing the table a DataSource instance will be the best way to manage data. The DataSource is meant to serve a place to encapsulate any sorting, filtering, pagination, and data retrieval logic specific to the application.

Eine DataSource beinhaltet also jegliche Logik, um Daten zu sortieren, filtern oder paginieren.

In vielen Fällen ist die Menge an Daten, die uns unser Server bietet, zu groß um direkt auf einmal dargestellt zu werden - wir würden sonst viele Daten laden, die gar nicht gebraucht werden und unsere Anwendung unnötig langsam machen. Um das zu vermeiden, schneiden wir unsere Daten und liefern nur einzelne Seiten aus. Dadurch können unsere Nutzer dann reibungslos von Seite zu Seite navigieren.

Dieses Konzept können wir innerhalb einer Anwendung bestimmt häufiger gebrauchen. Daher macht es Sinn, solch ein Verhalten in eine DataSource auszulagen um es einfach wiederverwenden zu können.

## Eine DataSource für Sortierung und Pagination

Schauen wir uns eine DataSource-Implementierung an, die es uns erlaubt Daten zu sortieren und aufeinanderfolgende Seiten abzurufen. Hierzu vereinfachen wir den DataSource-Datentyp von Angular Material zunächst etwas.

```typescript
import { DataSource } from '@angular/cdk/collections';
import { Observable } from 'rxjs';

export interface SimpleDataSource<T> extends DataSource<T> {
  connect(): Observable<T[]>;
  disconnect(): void;
}
```

Normalerweise akzeptieren die Methoden `connect()` und `disconnect()` einen [CollectionViewer](https://github.com/angular/components/blob/396154413538857811cb0c6bb71e4b4e26ecb320/src/cdk/collections/collection-viewer.ts). Es scheint jedoch etwas ungünstig gedacht, eine Komponente die eigentlich nur Daten darstellen soll, auch entscheiden zu lassen, welchen Teil der Daten sie darstellt. Daher sparen wir uns sowas wie einen `CollectionViewer`, die [offizielle DataSource für die Material-Tabelle macht das genauso](https://github.com/angular/components/blob/396154413538857811cb0c6bb71e4b4e26ecb320/src/material/table/table-data-source.ts).

Als nächstes definieren wir ein paar wiederverwendbare Datentypen für paginierte Daten - bspw. in einer Datei names `page.ts`.

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
Der generische Parameter `T` referenziert jeweils den Datentyp, welchen wir letztendlich darstellen wollen - später in unserem Anwendungsbeispiel ist das `User`.

Der Datentyp `Sort<T>` stellt eine Sortierung dar, welche auf unsere Daten angewendet werden soll (wobei die Anwendung letztendlich server-seitig stattfindet). Solche Sortierungen können wir später über die [Header der Material-Tabelle](https://material.angular.io/components/table/overview#sorting) oder auch über eine [Selektions-Komponente](https://material.angular.io/components/select/overview) und eine [Button-Gruppe](https://material.angular.io/components/button-toggle/overview) erstellen.

Ein `PageRequest<T>` ist das, was wir letztendlich an einen Service weitergeben werden, welcher dann die entsprechende Seite per HTTP vom Server holt. Als Antwort erwarten wir dann eine `Page<T>` mit den angefragten Daten. 

Der Funktionstyp `PaginationEndpoint<T>` akzeptiert ein `PageRequest<T>` und gibt einen RxJS-Stream, also ein Observable, mit der entsprechenden `Page<T>` zurück.

Jetzt können wir diese Datentypen verwenden um eine erste DataSource für Pagination zu implementieren:

```typescript
import { BehaviorSubject, Observable, Subject } from 'rxjs'
import { switchMap, startWith, map, shareReplay } from 'rxjs/operators';
import { Page, Sort, PaginationEndpoint } from './page';

export class PaginationDataSource<T> implements SimpleDataSource<T> {
  private pageNumber = new Subject<number>();
  private sort: BehaviorSubject<Sort<T>>;

  public page$: Observable<Page<T>>;

  constructor(
    endpoint: PaginationEndpoint<T>,
    initialSort: Sort<T>,
    size = 20) {
      this.sort = new BehaviorSubject<Sort<T>>(initialSort)
      this.page$ = this.sort.pipe(
        switchMap(sort => this.pageNumber.pipe(
          startWith(0),
          switchMap(page => endpoint({page, sort, size}))
        )),
        shareReplay(1)
      )
  }

  sortBy(sort: Partial<Sort<T>>): void {
    const lastSort = this.sort.getValue()
    const nextSort = {...lastSort, ...sort}
    this.sort.next(nextSort)
  }

  fetch(page: number): void {
    this.pageNumber.next(page);
  }

  connect(): Observable<T[]> {
    return this.page$.pipe(map(page => page.content));
  }

  disconnect(): void {}

}
```
Gehen wir das Ganze Schritt für Schritt durch, angefangen beim Konstruktor. Dieser akzeptiert drei Parameter:
* einen paginierten Endpunkt welchen wir benutzen, um Seiten abzurufen
* eine initiale Sortierung
* eine optionale Seitengröße, standardmäßig auf 20 Elemente pro Seite festgelegt

Die Instanzvariable `pageNumber` initialisieren wir mit einem RxJS-Subject - eine Senke, durch welche nach und nach verschieden Seitenzahlen wandern, welche es vom Server abzurufen gilt. Über die Methode `fetch(page: number)` können wir der DataSource mitteilen, welche Seite als nächste angefragt werden soll.

Der Instanzvariable `sort` weisen wir ein `BehaviorSubject` zu. Diese Senke erlaubt es uns, synchron den letzen Wert über `getValue()` abzurufen. Im Gegenzug müssen wir einen initialen Wert bereitstellen - unsere initiale Sortierung. Über die Methode `sortBy(sort: Partial<Sort<T>>)` können wir dann eine [partielle Repräsentation](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialt) unserer Sortierung mitgeben - also bspw. nur die Eigenschaft nach der wir als nächstes sortieren möchten, während die Richtung gleich bleibt. Dafür holen wir uns innerhalb von `sortBy` den letzen Wert der gesamten Sortierung und legen ihn mit der neuen, ggf. partiellen Sortierung, über den [Spread-Operator](https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Operators/Spread_operator) zusammen.

Unsere DataSource stellt über das Feld `page$` einen Stream aus Seiten bereit. Wir erstellen diesen basierend auf Veränderungen an der Sortierung. Jedes mal, wenn eine neue Sortierung durchgegeben wird, wechseln wir dann zu einem Stream aus Seitenzahlen mithilfe des [switchMap-Operators](https://rxjs-dev.firebaseapp.com/api/operators/switchMap) von RxJS. Solange die Sortierung dann gleich bleibt, gucken wir uns nur Seitenzahlen an - angefangen mit `0` für die erste Seite, was wir über den [startWith-Operator](https://rxjs-dev.firebaseapp.com/api/operators/startWith) konfigurieren.

Wenn die DataSource nun eine Seite abrufen soll, fragen wir den paginierten Endpunkt aus unserem Konstruktor mit den entsprechenden Parametern an. Dadurch liefert das entstehende Observable letztendlich die jeweiligen Datenseiten an eine oder mehrere Komponenten. Der Operator [shareReplay](https://rxjs-dev.firebaseapp.com/api/operators/shareReplay) sorgt dafür, dass bei der Verwendung einer DataSource durch mehrere Komponenten jeweils nur eine Serveranfrage abgesetzt wird. Zusätzlich können dadurch Komponenten die sich verspätet zur DataSource verbinden jeweils die letzte angefragte Seite erhalten. 

Abschließend stellen wir über die Methode `connect()` einen Stream aus Element-Listen zur Verfügung um dem DataSource Interface gerecht zu werden - damit arbeitet ja schließlich am Ende auch die Material-Tabelle. Hierzu verwenden wir den [map-Operator](https://rxjs-dev.firebaseapp.com/api/operators/map) von RxJS. Es ist wichtig, dass wir uns den Stream aus Seiten in `page$` bewahren, damit wir andere Informationen wie aktuelle Seitenzahl oder Seitengröße an die [MatPaginator-Komponente](https://material.angular.io/components/paginator/overview) weitergeben können. Hierrüber können Nutzer dann steuern, welche Seite angezeigt wird.

Die Methode `disconnect()` hat bei uns nichts zu tun - unsere DataSource schließt sich automatisch, sobald alle Komponente ihre Subscription beenden.

## Verwendung der DataSource in einer Komponente

In einer Komponente, die konkrete Daten darstellen soll, können wir nun unsere DataSource mit der Material-Tabelle verwenden. Dazu erstellen wir eine neue Instanz und übergeben eine Funktion die Seitenanfragen an einen entsprechenden Service weiterleitet.

```typescript
@Component(...)
export class UsersComponent  {

    initialSort: Sort<T> = {property: 'username', order: 'desc'}

    dataSource = new PaginationDataSource<User>(
      request => this.users.page(request),
      this.initialSort
    )

    constructor(private users: UserService) {}
}
```

Der `UserService` ist hier dafür verantwortlich aus einem `PageRequest<User>` eine HTTP-Anfrage zu machen, welche am Ende eine `Page<User>` liefert. Die Methode `page(request: PageRequest<User>)` könnte dazu wie folgt aussehen, je nachdem in welcher Form der Server eine solche Anfrage erwartet. Ggf. muss die Antwort mittels map-Operator noch so umgewandelt werden, dass sie dem Typ `Page<User>` entspricht. Alternativ können auch die Datentypen angepasst werden.

```typescript
page(request: PageRequest<User>, query: UserQuery): Observable<Page<User>> {
    const params = {
      pageNumber: request.page, 
      pageSize: request.size,
      sortOrder: request.sort.order,
      sortProperty: request.sort.property
    }
    return this.http.get<Page<User>>('/users', {params})
}
```

Im Template kann die DataSource nun an die Material-Tabelle weitergegeben werden. Wir definieren außerdem einen [MatPaginator](https://material.angular.io/components/paginator/overview) um die angezeigte Seite wechseln zu können. Über die [AsyncPipe](https://angular.io/api/common/NgIf#storing-a-conditional-result-in-a-variable) liefern wir diesem die benötigten Informationen.

Für die Sortierung stellen wir eine Selektion und eine Button-Gruppe bereit, welche bei Werteänderung jeweils `sortBy()` auf die DataSource aufrufen.

```html
<mat-form-field>
  <mat-label>Order by</mat-label>
  <mat-select [value]="initialSort.property" (selectionChange)="dataSource.sortBy({property: $event.value})">
    <mat-option value="id">ID</mat-option>
    <mat-option value="username">Username</mat-option>
  </mat-select>
</mat-form-field>
<mat-button-toggle-group [value]="initialSort.order" (change)="dataSource.sortBy({order: $event.value})">
  <mat-button-toggle value="asc"><mat-icon>arrow_upward</mat-icon></mat-button-toggle>
  <mat-button-toggle value="desc"><mat-icon>arrow_downward</mat-icon></mat-button-toggle>
</mat-button-toggle-group>
<table mat-table [dataSource]="dataSource">
  <!-- column definitions -->
</table>
<mat-paginator *ngIf="dataSource.page$ | async as page"
  [length]="page.totalElements" [pageSize]="page.size"
  [pageIndex]="page.number" [hidePageSize]="true" 
  (page)="dataSource.fetch($event.pageIndex)">
</mat-paginator>
```

## Suchen & Filtern

Bei einer großen Menge an Daten möchten wir dem Nutzer meist dabei helfen, das zu finden, was er sucht. Dazu könnten wir eine text-basierte Suche oder strukturierte Eingabefelder zum Filtern der Daten anhand einer bestimmten Eigenschaft bereitstellen. Solche Such-Parameter werden sich anhand der Daten die abgefragt werden unterscheiden. Um das zu bewerkstellen arbeiten wir mit einem weiteren generischen Parameter, welcher einen Satz an Such-Parametern darstellt. Dazu fügen wir den generischen Parameter `Q` zu unserer DataSource hinzu, wodurch wir den Typ `PaginationDataSource<T, Q>` erhalten.

Wir fügen auch noch einen weiteren Konstruktor-Parameter für initiale Suchparameter hinzu und erstellen eine Senke analog zu `sort`:

```typescript
this.query = new BehaviourSubject<Q>(initalQuery)
```

Außerdem fügen wir eine Methode `queryBy` hinzu, die genauso arbeitet wie `sortBy`:

```typescript
queryBy(query: Partial<Q>): void {
    const lastQuery = this.query.getValue();
    const nextQuery = {...lastQuery, ...query};
    this.query.next(nextQuery);
}
```

Nun starten wir unser Observable `page$` nicht mehr nur basierend auf `sort`, sondern kombinieren dessen Änderungen mit denen von `query`. Dazu verwenden wir die RxJS-Funktion [combineLatest](https://rxjs-dev.firebaseapp.com/api/index/function/combineLatest).

```typescript
this.page$ = combineLatest([this.sort, this.query]).pipe(
    switchMap(([sort, query]) => this.pageNumber.pipe(
      startWith(0),
      switchMap(page => endpoint({page, sort, size}, query))
    )),
    shareReplay(1)
)
```

Anschließend passen wir den Datentyp für einen paginierten Endpunkt so an, dass dieser auch Such-Parameter entgegennehmen kann.

```typescript
export type PaginationEndpoint<T, Q> = (req: PageRequest<T>, query: Q) => Observable<Page<T>>
```

Jetzt können wir unser Komponente aktualisieren, indem wir `PaginationDataSource<T, Q>` mit einem spezifischen Satz an Such-Parametern initialisieren, bspw. `UserQuery`. Dann stellen wir einen neuen Endpunkt zur Verfügung der auch diese Parameter an unseren `UserService` weiterleitet. Zusätzlich müssen wir noch eine initiales Query bereitstellen.

In unserem Beispiel ermöglichen wir eine Suche anhand von Freitext und dem Registrierungsdatum eines Benuters:

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

Im Template können wir ganz einfach die Werte aus einem Textfeld und einer Datumsauswahl an die DataSource über einen Aufruf von `dataSource.queryBy()` weitergeben. Es reicht wieder eine partielle Darstellung, da die jeweils anderen Suchparameter beibehalten werden.

```html
<mat-form-field>
    <mat-icon matPrefix>search</mat-icon>
    <input #in (input)="dataSource.queryBy({search: in.value})" type="text" matInput placeholder="Search">
</mat-form-field>
<mat-form-field>
    <input (dateChange)="dataSource.queryBy({registration: $event.value})" matInput [matDatepicker]="picker" placeholder="Registration"/>
    <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
    <mat-datepicker #picker></mat-datepicker>
</mat-form-field>
<table mat-table [dataSource]="dataSource">
  ...
</table>
...
```

Wenn nun irgend ein Eingabefeld geändert wird, sei es zur Sortierung oder Suche, wird die angezeigte Seite entsprechend aktualisiert (vorausgesetzt die Parameter landen richtig beim Server und der weiß damit umzugehen).

## Ladeanzeige

Um dem Nutzer mitzuteilen, dass gerade eine neue Seite angefragt wird, können wir unsere DataSource um ein weiteres Observable `loading$` erweitern. Dieses basiert auf der Senke `loading`:

```typescript
private loading = new Subject<boolean>();

public loading$ = this.loading.asObservable();
```

Dann können wir vor dem Aufruf des Endpunkts und danach mittels [finalize-Operator](https://rxjs-dev.firebaseapp.com/api/operators/finalize) jeweils einen entsprechenden boolschen Wert setzen:

```typescript
this.page$ = param$.pipe(
    switchMap(([query, sort]) => this.pageNumber.pipe(
      startWith(0),
      switchMap(page => {
        this.loading.next(true)
        return this.endpoint({page, sort, size}, query)
          .pipe(finalize(() => this.loading.next(false)))
      })
    )),
    share()
)
```

Alternative können wir auch den Operator `indicate(indicator: Subject<boolean>)` benutzen, welcher [hier](https://nils-mehlhorn.de/posts/indicating-loading-the-right-way-in-angular) vorgestellt wird.

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

Ein Ladeindikator, bspw. der [Material Progress Spinner](https://material.angular.io/components/progress-spinner/overview), lässt sich dann wie folgt anzeigen:

```html
<mat-spinner *ngIf="dataSource.loading$ | async" diameter="32"></mat-spinner>
```

## Fazit

Durch clevere Verhaltens-Parametrisierung können wir eine ganze Menge Logik wiederverwenden und so sehr leicht mächtige Komponenten schreiben die jegliche Art von Daten darstellen können. Unsere Erweiterung der Material DataSource ermöglicht uns Pagination, Sortierung und Suche von Remote-Daten in nur wenigen Zeilen.

Das ganze Anwendungsbeispiel findet sich interaktiv auf [StackBlitz](https://stackblitz.com/edit/angular-paginated-material-datasource). Die DataSource gibt es außerdem als Bibliothek: [ngx-pagination-data-source](https://github.com/nilsmehlhorn/ngx-pagination-data-source) - GitHub-Sterne herzlich willkommen.

<iframe 
style="width: 100%; height: 550px"
src="https://stackblitz.com/edit/angular-paginated-material-datasource?ctl=1&embed=1&view=preview">
</iframe>
