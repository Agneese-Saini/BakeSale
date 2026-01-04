import { Component, Inject, Input } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DecimalPipe } from "@angular/common";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { IItem, IItemDetail, Item } from "./item";
import { ICategory, ICustomizer } from "../header/category";
import { CartService } from "../checkout/cart";
import { RouterModule } from "@angular/router";
import { ItemChoiceList } from "./itemChoice";
import _ from "lodash";
import { Recipe } from "../recipe/recipe";

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
    <label [class]="'font-mono font-bold text-neutral ' + (size ? ('text-' + size) : 'text-lg')">{{ currency }}{{ value.price.value }}</label>
    } @else {
    <label [class]="'font-mono font-bold text-error ' + (size ? ('text-' + size) : 'text-lg')">FREE</label>
    }

    @if (!value.price.buyOneGetOne && value.price.previousPrice) {
    <label class="label font-mono">
      Was: <span class="text-sm line-through">{{ currency }}{{ value.price.previousPrice }}</span>
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
  @if (value.price.buyOneGetOne) {
  <span [class]="'badge badge-xs badge-soft text-nowrap outline font-bold ' + (value.price.style ? ('badge-' + value.price.style) : 'badge-error')">Buy 1, Get 1</span>
  } @else if (value.price.label) {
  <span [class]="'badge badge-xs badge-soft text-nowrap outline font-bold ' + (value.price.style ? ('badge-' + value.price.style) : 'badge-warning')">{{ value.price.label }}</span>
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
  public showSale: boolean = false;

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
<div [class]="'flex w-full flex-row ' + (detailsB.length != 0 ? 'p-2' : 'p-6')">
  <div class="grid grow place-items-center">
    <table class="table table-sm">
      <tbody>
        @for (detail of detailsA; track detail) {
        <tr>
          <th>
            @if (detail.icon) {
            <fa-icon icon="check"></fa-icon>
            }
            {{ detail.header }}
          </th>
          <th class="label">{{ detail.detail }}</th>
        </tr>
        }
      </tbody>
    </table>
  </div>

  @if (detailsB.length != 0) {
  <div class="divider divider-horizontal"></div>
  <div class="grid grow place-items-center">
    <table class="table table-sm">
      <tbody>
        @for (detail of detailsB; track detail) {
        <tr>
          <th>
            @if (detail.icon) {
            <fa-icon icon="check"></fa-icon>
            }
            {{ detail.header }}
          </th>
          <th class="label">{{ detail.detail }}</th>
        </tr>
        }
      </tbody>
    </table>
  </div>
  }
</div>
<br />
}
`
})
export class ItemDetails {
  
  @Input({ required: true })
  public item: IItem = Item.DefaultItem;

  protected detailsA: IItemDetail[] = [];
  protected detailsB: IItemDetail[] = [];
  protected get hasDetails(): boolean {
    return this.detailsA.length > 0;
  }

  protected ngOnInit() {
    this.parseDetails(this.item);
  }

  protected parseDetails(item: IItem) {
    if (item.details) {
      const len = item.details.length;

      for (let detail of item.details) {
        const length = detail.header.length + detail.detail.length;
        if (length > 24) {
          this.detailsA = item.details;
          this.detailsB = [];

          return;
        }
      }

      const limitA: number = Math.round(len / 2);

      for (let i: number = 0; i < limitA; i++) {
        const value = item.details.at(i);
        if (value) {
          this.detailsA.push(value);
        }
      }

      for (let i: number = limitA; i < len; i++) {
        const value = item.details.at(i);
        if (value) {
          this.detailsB.push(value);
        }
      }
    }
  }
};


@Component({
  imports: [FormsModule, FontAwesomeModule, RouterModule, ItemChoiceList, DecimalPipe, TextReadMore, PriceTag, ItemDetails],
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

    this.item = _.cloneDeep(data);
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
    this.cartService.removeFromCart(this.item);

    const message = this.item.name + ": was removed from your cart.";
    const snackBarRef = this.snackBar.open(message, "Undo", {
      duration: 2500
    });

    snackBarRef.onAction().subscribe(action => {
      this.cartService.addToCart(this.item);
    });

    this.dialogRef.close();
  }

  protected duplicate() {
    let newItem = _.cloneDeep(this.item);
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

    this.customizer = data.customizer ?? { name: '', description: '', icon: '' };
  }
};