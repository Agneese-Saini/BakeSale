import { ChangeDetectorRef, Component, Input, forwardRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { CartService, Cart } from '../checkout/cart';
import { ItemDialog } from './itemDialog';
import { CartItemsDialog } from '../checkout/cartItemDialog';
import { ChoiceList } from './itemChoice';
import { RouterLink } from "@angular/router";
import { DecimalPipe } from '@angular/common';

export interface IItemDetail {
  icon?: string,
  header: string,
  detail: string
};

export interface IItemPrice {
  value: number,
  previousPrice?: number,
  buyOneGetOne?: boolean,
  label?: string,
  style?: string
};

export interface IItem {
  name: string,
  price: IItemPrice,
  amount: number,
  stockAmount?: number,
  notify?: string,
  image?: string[],
  tags?: string[],
  about?: string,
  likes?: number,
  dislikes?: number,
  buys?: number,
  buyPeriod?: string,
  maxAmount?: number,
  choices?: ChoiceList,
  details?: IItemDetail[],
  ingredients?: string,
  author?: string,
  isChef?: boolean,
  company?: string,
  id?: number,
  parent?: string,
  prepTime?: number
};


@Component({
  selector: 'item',
  imports: [FormsModule, FontAwesomeModule, RouterLink, forwardRef(() => PriceTag)],
  templateUrl: './item.html'
})
export class Item {

  static readonly DefaultItem: IItem = {
    name: "No Name",
    price: { value: 0 },
    amount: 1
  };

  static readonly DefaultMaxAmount = 20;

  protected readonly CardSize = { 
    height: 'h-32 lg:h-52', 
    width: 'w-32 lg:w-52' 
  };

  @Input({ required: true })
  public value: IItem = Item.DefaultItem;

  protected shoppingCart: Cart = new Map();

  protected get amount(): number {
    let amount: number = 0;
    const items = this.shoppingCart.get(this.value.name);
    if (items != undefined) {
      for (let item of items) {
        amount += Number(item.amount);
      }
    }
    return amount;
  }

  protected get itemCount(): number {
    const items = this.shoppingCart.get(this.value.name);
    if (items != undefined) {
      return items.length;
    }
    return 0;
  }

  protected get hasChoices(): boolean {
    return this.value.choices != undefined && this.value.choices.size > 0;
  }

  constructor(
    private dialog: MatDialog,
    private cartService: CartService,
    private cdr: ChangeDetectorRef) { }

  protected ngOnInit() {
    this.cartService.shoppingCart$.subscribe(data => {
      this.shoppingCart = data;
      this.cdr.detectChanges();
    });
  }

  protected openItem() {
    if (this.itemCount == 1) {
      return this.openCartItemDialog();
    } else {
      return this.openCartItemsDialog();
    }
  }

  protected openCartItemDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = "";
    dialogConfig.data = this.shoppingCart.get(this.value.name)!.at(0);
    dialogConfig.width = '90%';

    const dialogRef = this.dialog.open(ItemDialog, dialogConfig);

    dialogRef.afterClosed().subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  protected openCartItemsDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = "";
    dialogConfig.data = this.value;

    const dialogRef = this.dialog.open(CartItemsDialog, dialogConfig);

    dialogRef.afterClosed().subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  protected getAuthorRank(author: string): string {
    let rank: string = '';
    if (author) {
      rank = 'Top 20 cake chef 2025'
    }

    return rank;
  }

  static getImage(item: IItem): string {
    return (item.image && item.image.length > 0)
      ? item.image[0]
      : 'https://static.vecteezy.com/system/resources/thumbnails/048/910/778/small/default-image-missing-placeholder-free-vector.jpg';
  }

  protected getImage = Item.getImage;

  static getLikeCount(item: IItem): number {
    const likes = item.likes != undefined ? item.likes : 0;
    const dislikes = item.dislikes != undefined ? item.dislikes : 0;
    return likes + dislikes;
  }

  protected getLikeCount = Item.getLikeCount;

  static getLikePercentage(item: IItem): number {
    const likes = item.likes != undefined ? item.likes : 0;
    const dislikes = item.dislikes != undefined ? item.dislikes : 0;
    const total = likes + dislikes;

    return (total != 0 ? likes / total : 0) * 100;
  }

  protected getLikePercentage = Item.getLikePercentage;

  static getAmount(item: IItem): number {
    return Number(item.amount * (item.price.buyOneGetOne ? 2 : 1));
  }

  static getPrice(item: IItem, rate?: number, amount?: number): number {
    let addon: number = 0;
    if (item.choices) {
      for (const [key, value] of item.choices) {
        for (const choice of value) {
          if (choice.amount != undefined && choice.amount > 0) {
            addon += choice.amount * (choice.price != undefined ? choice.price : 0);
          }
        }
      }
    }

    if (amount == undefined) {
      amount = item.amount;
    }

    if (amount < 0) {
      amount = 0;
    }

    if (!rate) {
      rate = item.price.value;
    }

    return amount * (rate + addon);
  };

  static numChoices(item: IItem): number {
    let num: number = 0;
    if (item.choices) {
      for (let [key, value] of item.choices) {
        for (const choice of value) {
          if (choice.amount && choice.amount > 0) {
            num += Number(choice.amount);
          }
        }
      }
    }

    return num;
  }

  static getChoicesPrice(item: IItem): number {
    let num: number = 0;
    if (item.choices) {
      for (let [key, value] of item.choices) {
        for (const choice of value) {
          if (choice.amount && choice.amount > 0) {
            num += Number(choice.amount) * (choice.price ? choice.price : 0);
          }
        }
      }
    }

    return num;
  }
};


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

<div class="flex flex-col">  
  <div class="flex flex-wrap items-center">
    @if (!value.price.buyOneGetOne && value.price.previousPrice) {
    <label [class]="'font-mono font-medium line-through opacity-65 px-1' + textSize">
      {{ currency }}{{ value.price.previousPrice | number: '1.0-2' }}
    </label>
    }

    @if (value.price.value > 0) {
    <label [class]="'font-mono font-semibold text-neutral' + textSize">{{ currency }}{{ value.price.value | number: '1.0-2' }}</label>
    } @else {
    <label [class]="'font-mono font-semibold text-error' + textSize">FREE</label>
    }
  
    @if (showSale == true) {
    @if (value.price.buyOneGetOne || (!value.price.buyOneGetOne && value.price.label)) {
    <span [class]="'badge text-nowrap font-mono px-1 mx-1' + badgeSize + badgeStyle">
      @if (value.price.buyOneGetOne) {
      Buy 1, Get 1
      } @else {
      {{ value.price.label }}
      }
    </span>
    }
    @else if (value.price.previousPrice) {
    <span [class]="'badge badge-success badge-soft text-nowrap font-semibold font-mono px-1 mx-1' + badgeSize">
      SAVE {{ '$' }}{{ (value.price.previousPrice - value.price.value) | number: '1.1-2' }}
    </span>
    }
    }
  </div>
  
  @if (showLikes == true) {
  <a class="link text-gray-600" style="text-decoration: none;">
    <fa-icon class="pr-1" icon="thumbs-up"></fa-icon>{{ getLikePercentage(value) | number: '1.0-0' }}% <i class="font-thin">({{ getLikeCount(value) }}+)</i>
  </a>
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