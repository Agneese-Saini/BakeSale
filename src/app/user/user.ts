import { Component, Injectable, Input } from '@angular/core';
import { IRecipe } from '../custom/recipe';
import { BehaviorSubject } from 'rxjs';
import { IOrderHistory } from './order-history';
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { IItem } from '../content/item';
import { DaysOfWeek } from '../custom/subscribe';

export enum UserRole {
  Guest = 0,
  Customer,
  Driver,
  Seller,
  Supervisor,
  Admin
};

export interface IPayMethod {
};

export interface IUser {
  name: string,
  userRole: UserRole,
  points?: number,
  verified?: boolean,
  image?: string,
  orders?: IOrderHistory[],
  recipeBook?: IRecipe[],
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
}


@Component({
  selector: 'user-card',
  imports: [FontAwesomeModule],
  template: `
<div class="flex justify-between items-center">
  <div class="flex gap-4 items-center">
    <a class="avatar link" style="text-decoration: none;">
      <div class="w-18 rounded-full ring ring-offset-2">
        <img src="https://img.daisyui.com/images/profile/demo/yellingcat@192.webp" />
      </div>
    </a>
    <div class="flex flex-col">
      <a class="link text-lg" style="text-decoration: none;">
        {{ user.name }}
        @if (user.verified) {
        <fa-icon class="text-sm text-info tooltip" data-tip="Verified" icon="check-circle"></fa-icon>
        }
      </a>
      <p class="text-xs label text-wrap"><fa-icon class="text-error" icon="star"></fa-icon> Top 20 bakers of 2025</p>
    </div>
  </div>

  <div class="flex gap-2">
    <div class="flex flex-col gap-2 items-center">
      <div class="label text-xs">Followers</div>
      <a class="link font-bold text-lg" style="text-decoration: none;">2.5k</a>
    </div>
    <div class="divider divider-horizontal py-2 m-1"></div>
    <div class="flex flex-col gap-2 items-center">
      <div class="label text-xs">Following</div>
      <a class="link font-bold text-lg" style="text-decoration: none;">920</a>
    </div>
  </div>
</div>
`
})
export class UserCard {

  @Input({ required: true })
  public user: IUser = UserService.DefaultUser;

}


@Component({
  selector: 'app-user',
  imports: [],
  templateUrl: './user.html',
  styleUrl: './user.css'
})
export class User {

}
