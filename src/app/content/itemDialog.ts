import { Component, Inject, Input } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DecimalPipe, KeyValuePipe } from "@angular/common";
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { IItem, Item } from "./item";
import { CustomizerType, ICategory, ICustomizer } from "../header/category";
import { CartService } from "../checkout/cart";
import { RouterModule } from "@angular/router";
import { ChoiceList, ItemChoiceList } from "./itemChoice";
import { Recipe } from "../custom/recipe";

@Component({
  selector: 'text-read-more',
  imports: [],
  template: `
<div>
  <span>
    {{ isCollapsed ? truncatedText  : text }}{{ ' ' }}
  </span>

  @if (text.length > maxLength) {
  <button class="link" (click)="toggleCollapse()">
    {{ isCollapsed ? 'Read More' : 'Read Less' }}
  </button>
  }
</div>
`
})
export class TextReadMore {

  @Input()
  public text: string = '';

  @Input()
  public maxLength: number = 100; // Default max length

  protected isCollapsed: boolean = true;
  protected truncatedText: string = '';

  protected ngOnInit() {
    this.truncateText();
  }

  protected truncateText() {
    if (this.text.length > this.maxLength) {
      this.truncatedText = this.text.substring(0, this.maxLength) + '...';
    } else {
      this.truncatedText = this.text;
    }
  }

  protected toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
  }
}


@Component({
  selector: 'item-price-tag',
  imports: [FontAwesomeModule, DecimalPipe],
  template: `

<div class="flex flex-col p-1">  
  <div class="flex items-center gap-2">
    @if (value.price.value > 0) {
    <label [class]="'font-mono font-bold text-neutral' + textSize">{{ currency }}{{ value.price.value | number: '1.0-2' }}</label>
    } @else {
    <label [class]="'font-mono font-bold text-error' + textSize">FREE</label>
    }

    @if (!value.price.buyOneGetOne && value.price.previousPrice) {
    <label [class]="'font-mono font-bold text-gray-500 line-through' + textSize">
      {{ currency }}{{ value.price.previousPrice | number: '1.0-2' }}
    </label>
    }
  </div>
  
  @if (showLikes == true) {
  <a class="link text-gray-600 px-2" style="text-decoration: none;">
    <fa-icon class="pr-1" icon="thumbs-up"></fa-icon>{{ getLikePercentage(value) | number: '1.0-0' }}% <i
      class="font-thin">({{
      getLikeCount(value) }}+)</i>
  </a>
  }
  
  @if (showSale == true) {
  @if (value.price.buyOneGetOne || (!value.price.buyOneGetOne && value.price.label)) {
  <span [class]="'badge px-1 text-nowrap font-mono ' + badgeSize + badgeStyle">
    @if (value.price.buyOneGetOne) {
    Buy 1, Get 1
    } @else {
    {{ value.price.label }}
    }
  </span>
  }
  @else if (value.price.previousPrice) {
  <span [class]="'badge badge-success badge-soft px-1 text-nowrap font-bold font-mono' + badgeSize">
    SAVE {{ '$' }}{{ (value.price.previousPrice - value.price.value) | number: '1.1-2' }}
  </span>
  }
  }
</div>

`
})
export class PriceTag {

  // Minimum likeCount required to show rating (see "getLikeCount")
  protected readonly minCustomers = 5;
  // Percentage limit cap! (for showing rating of an item)
  protected readonly minPercentage = 60;

  @Input({ required: true })
  public value: IItem = Item.DefaultItem;

  @Input()
  public currency: string = '$';

  @Input()
  public likes: boolean = true;

  @Input()
  public size: string = 'lg';

  @Input()
  public saleSize: string = 'sm';

  @Input()
  public showSale: boolean = false;

  protected get textSize(): string {
    return " text-" + this.size + ' ';
  }

  protected get badgeSize(): string {
    return " badge-" + this.saleSize + ' ';
  }

  protected get badgeStyle(): string {
    return " badge-" + (this.value.price.style ? this.value.price.style : (this.value.price.buyOneGetOne ? 'error text-white' : 'warning')) + ' ';
  }

  protected get showLikes(): boolean {
    return this.likes &&
      this.getLikeCount(this.value) > this.minCustomers &&
      this.getLikePercentage(this.value) > this.minPercentage;
  }

  constructor() { }

  protected getLikePercentage = Item.getLikePercentage;
  protected getLikeCount = Item.getLikeCount;
};


@Component({
  selector: 'item-details',
  imports: [FormsModule, FontAwesomeModule],
  template: `
@if (hasDetails) {
<table class="table table-sm">
  <tbody>
    @for (detail of item.details; track detail) {
    <tr>
      <th class="text-right">
        @if (detail.icon) {
        <fa-icon icon="check"></fa-icon>
        }
        {{ detail.header }}
      </th>
      <th class="label">
        {{ detail.detail }}
      </th>
    </tr>
    }
  </tbody>
</table>
}
`
})
export class ItemDetails {

  @Input({ required: true })
  public item: IItem = Item.DefaultItem;

  protected get hasDetails(): boolean {
    return this.item != undefined && this.item.details != undefined && this.item.details.length > 0;
  }
};


@Component({
  imports: [FormsModule, FontAwesomeModule, RouterModule, ItemChoiceList, KeyValuePipe, DecimalPipe, TextReadMore, PriceTag, ItemDetails, MatDialogModule],
  templateUrl: './itemDialog.html'
})
export class ItemDialog {

  public readonly defaultMaxAmount = Item.DefaultMaxAmount;

  protected item: IItem;
  protected displayImage?: string;

  protected getImage = Item.getImage;
  protected getPrice = Item.getPrice;

  constructor(
    @Inject(MAT_DIALOG_DATA) protected data: IItem,
    protected dialogRef: MatDialogRef<ItemDialog>,
    protected snackBar: MatSnackBar,
    protected cartService: CartService) {

    this.item = structuredClone(data);
  }

  protected ngOnInit() {
    this.displayImage = Item.getImage(this.item);

    // Reset errors
    if (this.item.choices) {
      for (let [key, value] of this.item.choices.entries()) {
        key.error = undefined;
      }
    }
  }

  protected selectImage(image: string) {
    this.displayImage = image;
  }

  protected checkForErrors(): boolean {
    if (this.item.choices) {
      for (let [key, value] of this.item.choices) {
        ItemChoiceList.ShowError(key, value);
      }

      for (let [key, value] of this.item.choices) {
        if (ItemChoiceList.HasError(key, value, false)) {
          this.snackBar.open("Please fix the errors before adding to cart.", "Close", {
            duration: 2500
          });
          return true;
        }
      }
    }

    if (this.item.stockAmount != undefined && this.item.stockAmount < Item.getAmount(this.item)) {
      this.snackBar.open("Only " + this.item.stockAmount + " left in stock, please select upto the limit.", "Close", {
        duration: 2500
      });
      return true;
    }

    return false;
  }

  protected saveToCart() {
    if (this.checkForErrors()) {
      return;
    }

    // add or update cart
    this.cartService.addToCart(this.item);

    const message = this.item.name + " updated in cart.";
    this.snackBar.open(message, "Close", {
      duration: 2500
    });

    this.dialogRef.close();
  }

  protected removeFromCart() {
    // remove from cart
    this.cartService.removeFromCart(this.data);

    const message = this.item.name + ": was removed from your cart.";
    const snackBarRef = this.snackBar.open(message, "Undo", {
      duration: 2500
    });

    snackBarRef.onAction().subscribe(action => {
      this.cartService.addToCart(this.data);
    });

    this.dialogRef.close();
  }

  protected duplicate() {
    let newItem = structuredClone(this.data);
    newItem.id = undefined;
    this.cartService.addToCart(newItem);

    const message = this.item.name + ": duplicate order added.";
    this.snackBar.open(message, "Close", {
      duration: 2500
    });

    this.dialogRef.close();
  }

  protected cancel() {
    this.dialogRef.close();
  }

  protected list(limit: number): number[] {
    return ItemDialog.numberList(1, limit);
  };

  static numberList(start: number, end: number): number[] {
    let ret: number[] = [];

    if (start > end) return ret;

    if (start == end) {
      ret.push(start);
      return ret;
    }

    for (let i = start; i <= end; i++) {
      ret.push(i);
    }
    return ret;
  };
};


@Component({
  imports: [FormsModule, FontAwesomeModule, RouterModule],
  template: `
<div class="bg-base-200 p-4">
  <div class="flex justify-between items-center">
    <div class="flex flex-col">
      <h2 mat-dialog-title class="text-4xl font-bold">Create Your Own</h2>
      <label class="label tooltip tooltip-right w-fit" data-tip="Points needed to use this option.">
        <fa-icon icon="coins" class="text-warning"></fa-icon> <b>{{ pointsRequiredForRecipe }}</b>
      </label>
    </div>

    <div class="flex flex-col items-center">
      <fa-icon [icon]="customizer.icon" class="text-4xl"></fa-icon>
      <h2 mat-dialog-title class="font-bold">{{ customizer.name }}</h2>
    </div>
  </div>

  <p class="mt-4">{{ customizer.description }}</p>

  <div class="grid mt-4">
    <button class="btn btn-neutral m-1" (click)="dialogRef.close()" routerLink="/create">
      Start Building
    </button>
    <button class="btn bg-base-100 m-1" (click)="dialogRef.close()">
      Cancel
    </button>
  </div>
</div>
`
})
export class ItemCreateDialog {

  protected customizer: ICustomizer;

  protected readonly pointsRequiredForRecipe = Recipe.PointsRequiredForRecipe;

  constructor(
    @Inject(MAT_DIALOG_DATA) protected data: ICategory,
    protected dialogRef: MatDialogRef<ItemCreateDialog>) {

    this.customizer = data.customizer ?? { name: '', description: '', icon: '', type: CustomizerType.Subscription };
  }
};