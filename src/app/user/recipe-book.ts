import { ChangeDetectorRef, Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from "@angular/router";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { IUser, UserService } from './user';
import { Cart, CartService } from '../checkout/cart';
import { DecimalPipe } from '@angular/common';
import { IItem, Item } from '../content/item';
import { DeliveryType } from '../header/delivery';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CartItemsDialog } from '../checkout/cartItemDialog';
import { IAddress } from '../header/addressDialog';
import { ITime } from '../header/timeslots';
import { Category, Recipe, IRecipe, RecipeGroup } from '../recipe/recipe';
import { ItemChoiceList } from '../content/itemChoice';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface IOrderHistory {
  tipAmount: number,
  gstPercentage: number,
  pstPercentage: number,
  couponDiscount: number,
  cart: Cart,
  date: number,
  time: ITime,
  address: IAddress,
  payment: string,
  deliveryType?: DeliveryType,
  deliveryInstructions?: string
};

@Component({
  selector: 'recipe-book',
  imports: [FormsModule, FontAwesomeModule, RouterModule, DecimalPipe],
  templateUrl: "recipe-book.html"
})
export class RecipeBook {

  readonly customTypes = Recipe.CustomTypes;

  protected filters: string[] = [
    "Today", "Tomorrow", "3 days old"
  ];

  protected currentFilter?: string;
  protected user: IUser = UserService.DefaultUser;

  constructor(
    private userService: UserService,
    private cartService: CartService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef) { }

  protected numItems = CartService.numItems;
  protected originalSubTotal = CartService.originalSubTotal;

  protected numChoices = Item.numChoices;
  protected getPrice = Item.getPrice;
  protected getAmount = Item.getAmount;

  protected subTotal(order: IOrderHistory): number {
    return CartService.subTotal(order.cart);
  }

  protected GST(order: IOrderHistory): number {
    return this.subTotal(order) * (order.gstPercentage / 100);
  }

  protected PST(order: IOrderHistory): number {
    return this.subTotal(order) * (order.pstPercentage / 100);
  }

  protected get deliveryFee(): number {
    return CartService.deliveryFee();
  }

  protected checkoutPrice(order: IOrderHistory): number {
    return this.subTotal(order)
      + this.deliveryFee
      + (this.GST(order) + this.PST(order))
      - order.couponDiscount
      + order.tipAmount;
  }

  protected ngOnInit() {
    this.userService.user$.subscribe(data => {
      this.user = data;
      this.cdr.detectChanges();
    });
  }

  protected addToCart(recipe: IRecipe) {
    const item: IItem = {
      name: recipe.name,
      about: recipe.desc,
      price: {
        value: recipe.value
      },
      amount: 1,
      maxAmount: 1
    };

    // add to cart
    this.cartService.addToCart(item);

    const message = item.name + " added to cart.";
    this.snackBar.open(message, "Close", {
      duration: 2500
    });
  }

  protected onSelectFilter(filter?: string) {
    this.currentFilter = filter;
  }

  static numLayers(recipeGroup: RecipeGroup) {
    let num = 0;

    const settings = recipeGroup.get(Category.Setup);
    if (settings) {
      const choice = ItemChoiceList.GetChoice(settings.choices, "Layers");
      if (choice) {
        num = Number(choice.extraid);
      }
    }

    return num;
  }

  protected numLayers = RecipeBook.numLayers;

  static getTheme(recipeGroup: RecipeGroup) {
    const settings = recipeGroup.get(Category.Setup);
    if (settings) {
      const choice = ItemChoiceList.GetChoice(settings.choices, "Theme");
      if (choice) {
        return choice.name;
      }
    }

    return null;
  }

  protected getTheme = RecipeBook.getTheme;

  static getPoints(recipe: IRecipe) {
    return recipe.buyHistory.size * recipe.pointsPerBuy;
  }

  protected getPoints = RecipeBook.getPoints;
};


@Component({
  imports: [FormsModule, FontAwesomeModule],
  template: `

<div class="bg-base-200 min-w-84 p-4">
  <figure>
    <img class="h-32 w-full" src="https://img.daisyui.com/images/stock/creditcard.webp" alt="3D card" />
  </figure>

  <div mat-dialog-title class="flex justify-between">
    <p class="text-4xl font-bold">Total</p>
    <p class="text-4xl font-bold">$20</p>
  </div>

   <button class="btn btn-neutral mt-4 w-full" (click)="closeDialog()">Close</button>
</div>

`
})
export class ReceiptDialog {

  constructor(
    @Inject(MAT_DIALOG_DATA) protected data: IOrderHistory,
    private dialogRef: MatDialogRef<CartItemsDialog>,
    private cartService: CartService) { }

  protected closeDialog() {
    this.dialogRef.close();
  }
}
