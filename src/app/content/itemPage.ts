import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, RouterModule } from "@angular/router";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { DecimalPipe, KeyValuePipe } from '@angular/common';
import { Recipe } from '../recipe/recipe';
import { IUser, UserService } from '../user/user';
import { IItem, Item } from './item';
import { Category, CategoryService, ICategory } from '../header/category';
import { ItemDetails, ItemDialog, PriceTag, TextReadMore } from "./itemDialog";
import { ItemChoiceList } from './itemChoice';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CartService } from '../checkout/cart';
import { Header } from "../header/header";
import { cloneDeep } from 'lodash';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-item',
  imports: [FormsModule, FontAwesomeModule, RouterModule, KeyValuePipe, DecimalPipe, PriceTag, TextReadMore, ItemChoiceList, Header, ItemDetails],
  templateUrl: "itemPage.html"
})
export class ItemPage {

  readonly customTypes = Recipe.CustomTypes;
  readonly defaultMaxAmount = Item.DefaultMaxAmount;

  protected item?: IItem;
  protected user: IUser = UserService.DefaultUser;
  protected categories: ICategory[] = [];
  protected displayImage?: string;
  
  private routeSubscription?: Subscription;

  protected get isCartItem(): boolean {
    return this.item ? (this.cartService.getCartItem(this.item) != undefined) : false;
  }

  protected get hasChoices(): boolean {
    return this.item ? (this.item.choices != undefined && this.item.choices.size > 0) : false;
  }

  protected list(limit: number): number[] {
    return ItemDialog.numberList(1, limit);
  };

  protected getImage = Item.getImage;
  protected getPrice = Item.getPrice;

  constructor(
    private route: ActivatedRoute,
    private categoryService: CategoryService,
    private userService: UserService,
    private cartService: CartService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef) { }

  protected ngOnInit() {

    this.categoryService.categories$.subscribe(data => {
      this.categories = data;
      this.cdr.detectChanges();
    });

    this.routeSubscription = this.route.paramMap.subscribe((params: ParamMap) => {
      const categoryName = params.get('category');
      const itemName = params.get('item');

      if (categoryName && itemName) {
        let category = Category.findCategory(categoryName, this.categories);
        this.item = category ? Category.findItem(itemName, category) : undefined;

        if (this.item) {
          this.itemOnInit();
        }
      }

      this.cdr.detectChanges();
    });

    this.userService.user$.subscribe(data => {
      this.user = data;
      this.cdr.detectChanges();
    });
  }

  protected itemOnInit() {
    if (!this.item) return;

    this.displayImage = Item.getImage(this.item);

    // Reset errors
    if (this.item.choices) {
      for (let [key, value] of this.item.choices.entries()) {
        key.error = undefined;
      }
    }

    // Set to default amount
    this.item.amount = Item.DefaultItem.amount;

    if (!this.item.choices) {
      const cartItem = this.cartService.getCartItem(this.item);
      if (cartItem != undefined) {
        this.item.amount = cartItem.amount;
      }
    }
    else {
      // Set to default choices
      for (let [key, value] of this.item.choices.entries()) {
        for (let choice of value) {
          choice.amount = 0;
        }
      }
    }
  }

  protected selectImage(image: string) {
    this.displayImage = image;
  }

  protected checkForErrors(item: IItem): boolean {
    if (item.choices) {
      for (let [key, value] of item.choices) {
        ItemChoiceList.ShowError(key, value);
      }

      for (let [key, value] of item.choices) {
        if (ItemChoiceList.HasError(key, value, false)) {
          this.snackBar.open("Please fix the errors before adding to cart.", "Close", {
            duration: 2500
          });
          return true;
        }
      }
    }

    if (item.stockAmount != undefined && item.stockAmount < Item.getAmount(item)) {
      this.snackBar.open("Only " + item.stockAmount + " left in stock, please select upto the limit.", "Close", {
        duration: 2500
      });
      return true;
    }

    return false;
  }

  protected addToCart(item: IItem) {
    if (this.checkForErrors(item)) {
      return;
    }

    // add to cart
    this.cartService.addToCart(item);

    const message = item.name + " added to cart.";
    this.snackBar.open(message, "Close", {
      duration: 2500
    });

    if (this.hasChoices) {
      this.itemOnInit();
    }
  }

  protected removeFromCart() {
    if (!this.item) return;

    const oldItem = cloneDeep(this.item);

    // remove from cart
    this.cartService.removeFromCart(this.item);
    this.itemOnInit(); 

    const message = this.item.name + ": was removed from your cart.";
    const snackBarRef = this.snackBar.open(message, "Undo", {
      duration: 2500
    });

    snackBarRef.onAction().subscribe(action => {
      this.cartService.addToCart(oldItem);
      this.itemOnInit();
      this.cdr.detectChanges();
    });   
  }
};