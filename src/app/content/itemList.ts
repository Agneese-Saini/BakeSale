import { ChangeDetectorRef, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from "@angular/router";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Category, CustomizerType, ICategory } from '../header/category';
import { ItemCreateDialog } from './itemDialog';
import { IItem, Item } from './item';
import { Recipe } from '../recipe/recipe';

@Component({
  selector: 'item-list',
  imports: [FormsModule, FontAwesomeModule, Item, RouterModule],
  template: `
@if (category.hidden) { 

<!-- hidden - no items display! -->

} @else {

<!-- Category name -->
@if (category.customizer || (category.items && category.items.length > 0)) {
<div class="flex w-full justify-between">
  @if (category.fontSize != undefined) {
  @if (category.fontSize == 3) {
  <h1 class="text-4xl font-bold font-serif">{{ category.name }}:</h1>
  }
  @else if (category.fontSize == 2) {
  <h1 class="text-2xl font-bold">{{ category.name }}:</h1>
  }
  @else if (category.fontSize == 1) {
  <h1 class="text-lg font-bold">{{ category.name }}:</h1>
  }
  @else if (category.fontSize == 0) {
  }
  @else {
  <h1 class="font-bold">{{ category.name }}:</h1>
  }
  }
  @else {
  <h1 class="font-bold">{{ category.name }}:</h1>
  }

  @if (category.items && itemsPerPage && category.items.length > itemsPerPage) {
  <button class="btn btn-ghost label" [routerLink]="['/content', {category: category.name}]">Show All</button>
  }
</div>
}

<!-- Category customizer -->
@if (category.customizer) {
@switch (category.customizer.type) {
@case (customizerType.Recipe) {
<div class="flex flex-col gap-2 p-2 pb-4">
  <button 
    [class]="'btn btn-ghost rounded-box flex flex-col gap-2 py-4 bg-base-300 justify-center items-center ' + cardSize.width + ' ' + cardSize.height"
    (click)="openItemCreateDialog(category)">
    <fa-icon class="text-4xl" [icon]="category.customizer.icon"></fa-icon>
    <button class="link w-fit text-xl font-extrabold" style="text-decoration: none;">Custom {{ category.customizer.name }}</button>
  </button>

  <div class="flex flex-col px-2">
    <label class="label">
      <fa-icon icon="coins" class="text-warning"></fa-icon> <b>{{ pointsRequiredForRecipe }}</b>(points required)
    </label>

    <div class="dropdown">
      <button class="link label text-sm" tabindex="0" role="button" style="text-decoration: none;">
        <fa-icon icon="info-circle"></fa-icon> How to earn points?
      </button>

      <div tabindex="0" class="dropdown-content card card-sm z-2 w-64 pt-2 shadow-xl">
        <div tabindex="0" class="card-body text-wrap bg-neutral text-white rounded-box">
          <h1 class="card-title"><fa-icon class="text-warning" icon="coins"></fa-icon> BakeSale Points Program</h1>
          <p>Through BakeSale points program, you earn points on your purchases, recipes, and even social media!</p>
          <p>You are automatically enrolled once you have an account with us: <a class="link">Sign In</a></p>
        </div>
      </div>
    </div>
  </div>
</div>
}
@case (customizerType.Subscription) {
<div class="card w-full bg-base-300 shadow">
  <div class="card-body">
    <h2 class="text-3xl font-bold">Get {{ category.customizer.name }} daily</h2>
    @if (category.customizer.info != undefined && category.customizer.info.length > 0) {
    @for (info of category.customizer.info; track info) {
    <div class="flex gap-2">
      <fa-icon [icon]="info.icon"></fa-icon>
      <span>{{ info.label }}</span>
    </div>
    }
    }
    <div class="mt-6">
      <button class="btn bg-orange-500 text-white btn-block">Get Started <fa-icon icon="arrow-right"></fa-icon></button>
    </div>
  </div>
</div>
}
}

<div class="divider m-0"></div>
}
<!-- Category items -->
@else {
@if (category.items && category.items.length > 0) {
<div class="flex flex-col pt-2 pb-4">
  <div #widgetsContent (scroll)="onScroll()" [class]="wrap ? 'overflow-none' : 'overflow-x-auto'">
    <div [class]="'flex ' + (wrap ? 'flex-wrap' : 'flex-nowrap')">
      @for (item of getItems(category); track item) {
      <div class="flex-shrink-0 ml-2.5">
        <item [value]="item"></item>
      </div>
      }
      @if (category.items && itemsPerPage && category.items.length > itemsPerPage) {
      <div class="flex-shrink-0 ml-2.5">
        <div class="flex flex-col h-full justify-center p-4">
          <a class="link" style="text-decoration: none;" [routerLink]="['/category', {name: category.name}]">
            <p class="label text-xl font-mono">+{{ category.items.length - itemsPerPage }}</p><br/>
            <p class="label font-mono">more items</p>
          </a>
        </div>
      </div>
      }
    </div>
  </div>
</div>
<div class="divider m-0"></div>
}
}
}

<!-- Sub Categories - Recursive -->
@if (category.subcats && category.subcats.length > 0) {
@for (subcat of category.subcats; track subcat) {
<item-list [category]="subcat" [wrap]="wrap" [itemsPerPage]="itemsPerPage"></item-list>
}
}
`
})
export class ItemList {

  protected customizerType = CustomizerType;
  protected cardSize = Item.CardSize;
  protected pointsRequiredForRecipe = Recipe.PointsRequiredForRecipe;

  @Input({ required: true })
  public category: ICategory = Category.DefaultCategory;

  @Input()
  public wrap: boolean = false;

  @Input()
  public itemsPerPage: number = 6;

  @ViewChild('widgetsContent', { read: ElementRef })
  public widgetsContent!: ElementRef<any>;

  protected showLeftScroll: boolean = false;
  protected showRightScroll: boolean = false;

  protected get last(): IItem | undefined {
    if (this.category.items) {
      return this.category.items[this.category.items.length - 1];
    }
    return undefined;
  }

  constructor(
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef) { }

  protected ngOnInit() { }

  protected ngAfterViewInit() {
  }

  protected getItems(category: ICategory): IItem[] {
    let displayItems: IItem[] = [];
    let count = 0;

    if (category.items) {
      if (this.itemsPerPage) {
        for (let item of category.items) {
          if (count++ == this.itemsPerPage)
            break;

          displayItems.push(item);
        }
      }
      else {
        displayItems = category.items;
      }
    }

    return displayItems;
  }

  protected openItemCreateDialog(category: ICategory) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = "";
    dialogConfig.data = category;

    const dialogRef = this.dialog.open(ItemCreateDialog, dialogConfig);

    dialogRef.afterClosed().subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  protected onScroll() {
    const element = this.widgetsContent.nativeElement;
    // The button should be shown if scrollLeft is greater than 0
    this.showLeftScroll = element.scrollLeft > 0;
    // The button should be shown if scrollRight is greater than 0
    this.showRightScroll = element.scrollRight > 0;
  }

  public scrollRight(): void {
    this.widgetsContent.nativeElement.scrollTo({ left: (this.widgetsContent.nativeElement.scrollLeft + 150), behavior: 'smooth' });
  }

  public scrollLeft(): void {
    this.widgetsContent.nativeElement.scrollTo({ left: (this.widgetsContent.nativeElement.scrollLeft - 150), behavior: 'smooth' });
  }
};