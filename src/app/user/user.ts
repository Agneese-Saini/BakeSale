import { Component, inject, Injectable } from '@angular/core';
import { IRecipe } from '../custom/recipe';
import { BehaviorSubject } from 'rxjs';
import { IOrderHistory } from './order-history';
import { ISubscription } from '../custom/subscribe';
import { MatDialog } from '@angular/material/dialog';
import { CanActivateFn, Router } from '@angular/router';
import { IAddress, Province } from '../header/addressDialog';

export enum UserRole {
  Guest = 0,
  Customer,
  Driver,
  Chef,
  Admin
};

export interface IPayMethod {
  name: string,
  type: string,
  cardNumber?: string,
  icon?: string
};

export interface IUser {
  name: string,
  userRole: UserRole,
  verified?: boolean,
  image?: string,
  orders?: IOrderHistory[],
  recipeBook?: IRecipe[],
  subscriptions?: ISubscription[],
  savedPayMethods?: IPayMethod[]
};


@Injectable({
  providedIn: 'root' // Makes the service a singleton and available throughout the app
})
export class UserService {

  static readonly DefaultUser: IUser = {
    name: 'Guest',
    userRole: UserRole.Guest
  }

  private _user = new BehaviorSubject<IUser>(UserService.DefaultUser);
  public user$ = this._user.asObservable(); // Expose as Observable

  private _addressBook = new BehaviorSubject<IAddress[]>([{
    label: "Home",
    addressLine: "Area 51",
    city: "Winnipeg",
    province: Province.MB,
    postal: "R1W 2G3"
  }]);
  public addressBook$ = this._addressBook.asObservable(); // Expose as Observable

  constructor(
    private dialog: MatDialog) { }

  public get id() {
    let value = this._user.value;
    return value.name;
  }

  public isLoggedIn() {
    let value = this._user.value;
    return value.userRole != UserRole.Guest;
  }

  public login(name: string, password: string) {
    const prevUser = this._user.value;
    const prevAddressBook = this._addressBook.value;

    // load user address book from cloud
    let newAddressBook: IAddress[] = [];
    //

    for (let x of prevAddressBook) {
      newAddressBook.push(x);
    }
    
    this._addressBook.next(newAddressBook);

    // load user data from cloud
    let newUser: IUser = {
      name: 'Agneese',
      userRole: UserRole.Admin,
      recipeBook: [],
      savedPayMethods: []
    };
    //

    if (prevUser.recipeBook) {
      for (const x of prevUser.recipeBook) {
        newUser.recipeBook!.push(x);
      }
    }

    if (prevUser.savedPayMethods) {
      for (const x of prevUser.savedPayMethods) {
        newUser.savedPayMethods!.push(x);
      }
    }

    this._user.next(newUser);
  }

  public logout() {
    this._user.next(UserService.DefaultUser);
    this._addressBook.next([]);
  }

  public addOrder(order: IOrderHistory) {
    let value = this._user.value;
    if (!value.orders) {
      value.orders = [];
    }

    value.orders.push(order);
    this._user.next(value);
  }

  public addRecipe(recipe: IRecipe) {
    let value = this._user.value;
    if (!value.recipeBook) {
      value.recipeBook = [];
    }
    value.recipeBook.push(recipe);
    this._user.next(value);
  }

  public addSubscription(sub: ISubscription) {
    let value = this._user.value;
    if (!value.subscriptions) {
      value.subscriptions = [];
    }
    value.subscriptions.push(sub);
    this._user.next(value);
  }
}


export const LoginGuard: CanActivateFn = (route, state) => {
  const authService = inject(UserService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    // Access granted
    return true;
  }

  // Redirect to home page
  return router.parseUrl('/');
};


@Component({
  selector: 'app-user',
  imports: [],
  templateUrl: './user.html',
  styleUrl: './user.css'
})
export class User {

  static numActiveOrders(user: IUser): number {
    if (user.orders == undefined) return 0;

    let num = 0;
    for (let order of user.orders) {
      if (order.completionTime == undefined) {
        ++num;
      }
    }

    return num;
  }

}