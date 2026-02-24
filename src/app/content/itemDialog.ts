import { Component, Inject, Input } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DecimalPipe, KeyValuePipe } from "@angular/common";
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule, MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { IItem, Item } from "./item";
import { CartService } from "../checkout/cart";
import { RouterModule } from "@angular/router";
import { ItemChoiceList } from "./itemChoice";

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
    <label [class]="'font-mono font-semibold text-neutral' + textSize">{{ currency }}{{ value.price.value | number: '1.0-2' }}</label>
    } @else {
    <label [class]="'font-mono font-semibold text-error' + textSize">FREE</label>
    }

    @if (!value.price.buyOneGetOne && value.price.previousPrice) {
    <label [class]="'font-mono font-semibold text-gray-500 line-through' + textSize">
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
  <span [class]="'badge badge-success badge-soft px-1 text-nowrap font-semibold font-mono' + badgeSize">
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
    @for (detail of item.details; track $index) {
    <tr>
      <th class="text-right">
        @if (detail.icon) {
        <fa-icon icon="check"></fa-icon>
        }
        {{ detail.header }}
      </th>
      <td>
        {{ detail.detail }}
      </td>
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
  imports: [FormsModule, FontAwesomeModule, RouterModule, ItemChoiceList, KeyValuePipe, DecimalPipe, TextReadMore, PriceTag, MatDialogModule],
  templateUrl: './itemDialog.html'
})
export class ItemDialog {

  public readonly defaultMaxAmount = Item.DefaultMaxAmount;

  protected item: IItem;
  protected displayImage?: string;

  protected getImage = Item.getImage;
  protected getPrice = Item.getPrice;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: IItem,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<ItemDialog>,
    private snackBar: MatSnackBar,
    private cartService: CartService) {

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

    const message = this.item.name + " was changed in your cart.";
    this.snackBar.open(message, "Close", {
      duration: 2500
    });

    this.dialogRef.close();
  }

  protected removeFromCart() {
    // remove from cart
    this.cartService.removeFromCart(this.data);

    const message = this.item.name + " was removed from your cart.";
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

  protected closeAll() {
    this.dialog.closeAll();
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