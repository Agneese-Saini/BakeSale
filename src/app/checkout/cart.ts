import { Component, Injectable } from "@angular/core";
import { IItem, Item } from "../content/item";
import { BehaviorSubject } from "rxjs";
import { FormsModule } from "@angular/forms";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

export type Cart = Map<string, IItem[]>;

@Injectable({
  providedIn: 'root' // Makes the service a singleton and available throughout the app
})
export class CartService {

  private _shoppingCart = new BehaviorSubject<Cart>(new Map());
  public shoppingCart$ = this._shoppingCart.asObservable();

  private _coupon = new BehaviorSubject<number>(0);
  public coupon$ = this._coupon.asObservable();

  public getCartItem(item: IItem) {
    const itemName = item.name;
    const itemID = item.id;

    let cart = this._shoppingCart.value;
    let cartItems = cart.get(itemName);
    
    if (!cartItems || cartItems.length == 0) {
      return undefined;
    }

    if (item.choices && item.choices.size > 0 && itemID != undefined) {
      const index = cartItems.findIndex(value => (value.id == itemID));
      // Existing item
      if (index != -1) {
        return cartItems[index];
      }

      return undefined;
    }

    // Item with no choices only have one instance
    if (cartItems) {
      return cartItems[0];
    }

    return undefined;
  }

  public addToCart(item: IItem) {
    const itemName = item.name;
    const itemID = item.id;
    let newItem = structuredClone(item);

    let cart = this._shoppingCart.value;
    let cartItems = cart.get(itemName);

    if (item.choices && item.choices.size > 0) {
      if (itemID != undefined && cartItems && cartItems.length > 0) {
        const index = cartItems.findIndex(value => (value.id == itemID));
        // Update an existing item
        if (index != -1) {
          cartItems[index] = newItem;
          cart.set(itemName, cartItems);
          this._shoppingCart.next(cart);
          return;
        }
      }

      // Adding a new item to list
      newItem.id = Date.now();
    }

    // If item don't exist
    if (!cartItems || (!item.choices || item.choices.size == 0)) {
      cartItems = [newItem];
    } else {
      cartItems.push(newItem);
    }

    cart.set(itemName, cartItems);
    this._shoppingCart.next(cart);
  }

  public removeFromCart(item: IItem) {
    const itemName = item.name;
    const itemID = item.id;
    let cart = this._shoppingCart.value;

    let cartItems = cart.get(itemName);
    if (!cartItems) return;

    if (cartItems.length > 0) {
      if (itemID != undefined) {
        const index = cartItems.findIndex(value => (value.id && value.id == itemID));
        if (index == -1) return;

        cartItems.splice(index, 1);
        cart.set(itemName, cartItems);
        this._shoppingCart.next(cart);
        return;
      }
    }

    cart.delete(itemName);
    this._shoppingCart.next(cart);
  }

  public addCoupon(code?: string): string | null {
    if (!code || code.length == 0) {
      return "Please enter a code to activate.";
    }

    if (code.length < 6) {
      return "Unknown coupon code entered.";
    }

    this._coupon.next(2);

    return null;
  }

  static deliveryFee(): number {
    return 4.00;
  }

  static numItems(cart: Cart): number {
    let num: number = 0;
    for (let [key, value] of cart) {
      for (let item of value) {
        num += Number(item.amount);
      }
    }

    return num;
  }

  static totalItems(cart: Cart): number {
    let num: number = 0;
    for (let [key, value] of cart) {
      for (let item of value) {
        num += Item.getAmount(item);
      }
    }

    return num;
  }

  static originalSubTotal(cart: Cart): number {
    let total: number = 0;
    for (const [key, value] of cart) {
      for (const item of value) {
        if (item.price.buyOneGetOne) {
          total += Item.getPrice(item, item.price.value) * 2;
        } else if (item.price.previousPrice) {
          total += Item.getPrice(item, item.price.previousPrice);
        } else {
          total += Item.getPrice(item, item.price.value);
        }
      }
    }

    return total;
  }

  static subTotal(cart: Cart): number {
    let total: number = 0;
    for (const [key, value] of cart) {
      for (const item of value) {
        total += Item.getPrice(item, item.price.value);
      }
    }

    if (total < 0) {
      total = 0.0;
    }

    return total;
  }
};


@Component({
  selector: 'empty-cart-links',
  imports: [FormsModule, FontAwesomeModule],
  template: `
<div class="flex flex-wrap gap-4 m-2 justify-center">
  <a class="link text-lg font-thin">Find Deals</a>
  <a class="link text-lg font-thin">Weekly Flyers</a>
  <a class="link text-lg font-thin">Cannabis Deals</a>
  <a class="link text-lg font-thin">Buy One Get One</a>
  <a class="link text-lg font-thin">Order Snacks</a>
  <a class="link text-lg font-thin">Your Order History</a>
</div>
`
})
export class EmptyCartLinks {
}