import { Component, Injectable, Input } from '@angular/core';
import { IRecipe } from '../custom/recipe';
import { BehaviorSubject } from 'rxjs';
import { IOrderHistory } from './order-history';
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ISubscription } from '../custom/subscribe';

export enum UserRole {
  Guest = 0,
  Customer,
  Driver,
  Chef,
  Admin
};

export interface IPayMethod {
  name: string,
  cardNumber: string
};

export interface IUser {
  name: string,
  userRole: UserRole,
  points?: number,
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

  public login(name: string, password: string) {
    let value: IUser = {
      name: 'Agneese',
      userRole: UserRole.Admin
    };
    this._user.next(value);
  }

  public logout() {
    this._user.next(UserService.DefaultUser);
  }

  public guest() {
    let value = this._user.value;
    value.userRole = UserRole.Customer;
    this._user.next(value);
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


@Component({
  selector: 'app-user',
  imports: [],
  templateUrl: './user.html',
  styleUrl: './user.css'
})
export class User {

}
