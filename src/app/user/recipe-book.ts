import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from "@angular/router";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { IUser, UserService } from './user';
import { CartService } from '../checkout/cart';
import { DecimalPipe } from '@angular/common';
import { IItem } from '../content/item';
import { Category, Recipe, IRecipe, RecipeGroup } from '../custom/recipe';
import { ItemChoiceList } from '../content/itemChoice';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IOrderHistory } from './order-history';

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

  protected subTotal(order: IOrderHistory): number {
    return CartService.subTotal(order.cart);
  }

  protected GST(order: IOrderHistory): number {
    return this.subTotal(order) * (order.gstPercentage / 100);
  }

  protected PST(order: IOrderHistory): number {
    return this.subTotal(order) * (order.pstPercentage / 100);
  }

  protected checkoutPrice(order: IOrderHistory): number {
    return this.subTotal(order)
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
    return recipe.buyHistory.size * Recipe.PointsPerRecipe;
  }

  protected getPoints = RecipeBook.getPoints;
};