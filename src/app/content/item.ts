import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { CartService, Cart } from '../checkout/cart';
import { ItemDialog, PriceTag } from './itemDialog';
import { CartItemsDialog } from '../checkout/cartItemDialog';
import { ChoiceList } from './itemChoice';
import { RouterLink } from "@angular/router";
import * as _ from 'lodash';

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
  label?: string,
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
  tags?: string[],
  parent?: string
};


@Component({
  selector: 'item',
  imports: [FormsModule, FontAwesomeModule, PriceTag, RouterLink],
  templateUrl: './item.html'
})
export class Item {

  static readonly DefaultItem: IItem = {
    name: "No Name",
    price: { value: 0 },
    amount: 1
  };

  static readonly DefaultMaxAmount = 20;

  static readonly CardSize = { height: 'h-38 lg:h-54', width: 'w-38 lg:w-54' };
  protected cardSize = Item.CardSize;

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
    dialogConfig.data = this.shoppingCart.get(this.value.name)?.at(0);

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

  public getImage = Item.getImage;

  static getLikeCount(item: IItem): number {
    const likes = item.likes != undefined ? item.likes : 0;
    const dislikes = item.dislikes != undefined ? item.dislikes : 0;
    return likes + dislikes;
  }

  public getLikeCount = Item.getLikeCount;

  static getLikePercentage(item: IItem): number {
    const likes = item.likes != undefined ? item.likes : 0;
    const dislikes = item.dislikes != undefined ? item.dislikes : 0;
    const total = likes + dislikes;

    return (total != 0 ? likes / total : 0) * 100;
  }

  public getLikePercentage = Item.getLikePercentage;

  static getAmount(item: IItem): number {
    return item.amount ? Number(item.amount) : 0;
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

    if (amount == undefined && item.amount != undefined) {
      amount = item.amount;
    }

    if (amount == undefined || amount < 0) {
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
};
