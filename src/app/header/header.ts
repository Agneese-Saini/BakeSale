import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AddressBook, DeliveryService, IDeliverySettings, AddressBookDialog, DeliveryMode } from './addressBook';
import { CartService, Cart } from '../checkout/cart';
import { Category, CategoryList, CategoryService, ICategory } from './category';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { SideDrawer } from '../sidedrawer/sidedrawer';
import { CheckoutDrawer } from '../checkout/checkout-drawer';
import { IUser, User, UserRole, UserService } from '../user/user';
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { AddressDialog, IAddress } from './addressDialog';
import { MatSnackBar } from '@angular/material/snack-bar';


@Component({
  selector: 'app-logo',
  imports: [FontAwesomeModule],
  template: `
@switch (style) {
@case (0) {
<a class="link text-2xl font-serif" style="text-decoration: none" (click)="onClick.emit();">
  <b class="text-neutral-700">{{ firstName }}</b>{{ lastName }}
</a>
}
@case (1) {
<div class="flex flex-col items-center text-xs space-y-0">
  <label class="font-extrabold underline decoration-2 underline-offset-3">{{ firstName }}</label>
  <label class="text-grow">{{ lastName }}</label>
</div>
}
@default {
}
}
`
})
export class Logo {

  @Input({ required: true })
  public firstName: string = "Name Here";

  @Input()
  public lastName?: string;

  @Input()
  public style: number = 0;

  @Output()
  public onClick = new EventEmitter<void>();

};


@Component({
  selector: 'search-bar',
  imports: [FormsModule, FontAwesomeModule, CategoryList],
  template: `

<fieldset class="fieldset">
  <div class="join">
    <label [class]="'input w-full join-item rounded-l-full ' + (categoryMenu ? '' : 'rounded-full')">
      <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <g stroke-linejoin="round" stroke-linecap="round" stroke-width="2.5" fill="none" stroke="currentColor">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.3-4.3"></path>
        </g>
      </svg>
      <input type="search" class="w-full lg:min-w-84" placeholder="Search BakeSale" />
    </label>

    @if (categoryMenu) {
    <div class="dropdown dropdown-bottom dropdown-end join-item">
      <button tabindex="0" role="button" class="btn border-neutral-300 text-xs text-nowrap rounded-r-full">
        {{ getFilterLabel() }} <fa-icon icon="filter"></fa-icon>
      </button>

      <ul tabindex="0" class="dropdown-content menu bg-base-300 rounded-box z-50 w-65 p-2 shadow-2xl">
        <category-list />
      </ul>
    </div>
    }
  </div>
</fieldset>

`
})
export class SearchBar {

  protected categories: ICategory[] = [];

  @Input()
  public categoryMenu: boolean = true;

  constructor(
    private categoryService: CategoryService,
    private cdr: ChangeDetectorRef) { }

  protected ngOnInit() {
    this.categoryService.categories$.subscribe(data => {
      this.categories = data;
      this.cdr.detectChanges();
    });
  }

  protected getSelectedCategories() {
    let selected = [];
    for (let cat of this.categories) {
      if (cat.checked || Category.isPartiallyChecked(cat)) {
        selected.push(cat);
      }
    }
    return selected;
  }

  protected getFilterLabel() {
    const categories = this.getSelectedCategories();

    if (categories.length == 1) {
      return categories[0].name;
    }

    if (categories.length == this.categories.length) {
      return 'Filter';
    }

    return 'Filter' + ' ' + '(' + categories.length + ')';
  }

};


@Component({
  selector: 'delivery-switch',
  imports: [FormsModule, FontAwesomeModule],
  template: `
<div class="tabs tabs-sm tabs-box w-fit">
  @for (entry of deliveryModes; track entry[0]) {
  <input type="radio" class="tab" [name]="name" [checked]="selectedDeliveryMode == entry[0]"
    [ariaLabel]="entry[1].label" [value]="entry[0]" [(ngModel)]="selectedDeliveryMode"
    (change)="onDeliveryModeChange()" />
  }
</div>
`
})
export class DeliverySwitch {

  static deleiverySwitchCount: number = 0;

  @Input()
  protected switchName?: string;

  protected get name(): string {
    if (!this.switchName) {
      this.switchName = "DeliverySwitch#" + DeliverySwitch.deleiverySwitchCount++;
    }
    return this.switchName;
  }

  protected selectedDeliveryMode: DeliveryMode = DeliveryMode.Delivery;
  protected deliverySettings: IDeliverySettings = AddressBook.DefaultSettings;

  protected get deliveryModes() {
    return Array.from(AddressBook.DeliveryModes.entries());
  }

  constructor(
    private deliveryService: DeliveryService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef) { }

  protected ngOnInit() {
    this.deliveryService.deliverySettings$.subscribe(data => {
      this.deliverySettings = data;
      this.selectedDeliveryMode = this.deliverySettings.mode;
      this.cdr.detectChanges();
    });
  }

  protected onDeliveryModeChange() {
    if (this.deliverySettings.mode != this.selectedDeliveryMode) {
      this.deliverySettings.mode = this.selectedDeliveryMode;
      this.deliveryService.setDeliverySetting(this.deliverySettings);

      this.deliveryService.loadAddressBook(this.selectedDeliveryMode);
      this.deliveryService.loadTimeslots(this.selectedDeliveryMode);

      const message = "Changed to " + AddressBook.DeliveryModes.get(this.selectedDeliveryMode)?.label + ".";
      this.snackBar.open(message, "Close", {
        duration: 2500
      });
    }
  }
};


export enum NotifictionType {
  Suggestion,
  ThumbsUp,
  Review,
  OrderDelivered,
};

@Component({
  imports: [FontAwesomeModule],
  template: `
<ul class="list bg-base-100 rounded-box shadow-md max-h-92 overflow-y-auto">
  <li class="p-4 pb-2 text-sm opacity-60 tracking-wide">Notifications</li>
  
  <li class="list-row">
    <div>
      <img class="size-10 rounded-box" src="https://tatyanaseverydayfood.com/wp-content/uploads/2022/03/The-Best-Dark-Chocolate-Cake-Recipe-3.jpg"/>
    </div>
    <div>
      <a class="link" style="text-decoration: none;">Suggestion: <b>Chcoclate Cake</b></a>
      <div class="text-xs text-gray-500">We thought you might like this new arrival!</div>
    </div>
    <label class="label font-bold">
      2h
    </label>
  </li>

  <li class="list-row">
    <div>
      <img class="size-10 rounded-box" src="https://img.daisyui.com/images/profile/demo/1@94.webp"/>
    </div>
    <div>
      <a class="link font-bold" style="text-decoration: none;">Shanees</a> gave your profile a Thumbs Up <fa-icon icon="thumbs-up"></fa-icon>!
    </div>
    <label class="label font-bold">
      2h
    </label>
  </li>

  <li class="list-row">
    <div>
      <img class="size-10 rounded-box" src="https://tatyanaseverydayfood.com/wp-content/uploads/2022/03/The-Best-Dark-Chocolate-Cake-Recipe-3.jpg"/>
    </div>
    <div>
      <a class="link" style="text-decoration: none;"><b>Chcoclate Cake</b>&nbsp;&nbsp;<fa-icon icon="thumbs-up"></fa-icon> 72%</a>
      <div>3 people reviewed your custom cake.</div>
    </div>
    <label class="label font-bold">
      2h
    </label>
  </li>

  <li class="list-row">
    <div>
      <fa-icon class="text-xl text-success" icon="car-side"></fa-icon>
    </div>
    <div>
      <div><a class="link font-bold" style="text-decoration: none;">Your Order</a> was delivered.</div>
      <div class="text-xs text-gray-500">3 Items delivered at 11:00 am.</div>
      <img class="link size-12 rounded-box" src="https://onfleet.com/blog/content/images/2020/05/deliverypackage.jpg"/>
    </div>
    <label class="label font-bold">
      2h
    </label>
  </li>  
</ul>
  `,
})
export class NotificationBottomSheet {
  
  constructor(
    private bottomSheetRef: MatBottomSheetRef<NotificationBottomSheet>) { }

  openLink(event: MouseEvent): void {
    this.bottomSheetRef.dismiss();
    event.preventDefault();
  }
}


@Component({
  selector: 'app-header',
  imports: [FormsModule, FontAwesomeModule, RouterModule, SearchBar, AddressBook, Logo, DeliverySwitch],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {

  protected appDrawer = SideDrawer.name;
  protected checkoutDrawer = CheckoutDrawer.name;
  protected userRole = UserRole;

  protected printTimeslot = AddressBook.printTimeslot;

  protected deliverySettings: IDeliverySettings = AddressBook.DefaultSettings;
  protected addressBook: IAddress[] = [];
  protected shoppingCart: Cart = new Map();
  protected user: IUser = UserService.DefaultUser;

  protected get isDelivery() {
    return this.deliverySettings.mode == DeliveryMode.Delivery;
  }

  protected get deliveryMode() {
    return AddressBook.DeliveryModes.get(this.deliverySettings.mode);
  }

  protected get numItems() {
    return CartService.numItems(this.shoppingCart);
  }

  protected get totalItems() {
    return CartService.totalItems(this.shoppingCart);
  }

  protected get originalPrice(): number {
    return CartService.originalSubTotal(this.shoppingCart);
  }

  protected get subTotal(): number {
    return CartService.subTotal(this.shoppingCart);
  }

  protected get numActiveOrders(): number {
    return User.numActiveOrders(this.user);
  }
  
  constructor(
    private router: Router,
    private dialog: MatDialog,
    private bottomSheet: MatBottomSheet,
    private deliveryService: DeliveryService,
    private cartService: CartService,
    private userService: UserService,
    private cdr: ChangeDetectorRef) { }

  protected ngOnInit() {
    this.deliveryService.deliverySettings$.subscribe(data => {
      this.deliverySettings = data;
      this.cdr.detectChanges();
    });

    this.deliveryService.addressBook$.subscribe(data => {
      this.addressBook = data;
      this.cdr.detectChanges();
    });

    this.cartService.shoppingCart$.subscribe(data => {
      this.shoppingCart = data;
      this.cdr.detectChanges();
    });

    this.userService.user$.subscribe(data => {
      this.user = data;
      this.cdr.detectChanges();
    });
  }

  protected openDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = "";
    dialogConfig.data = undefined;
    dialogConfig.width = '90%';

    const dialogRef = this.addressBook.length > 0
      ? this.dialog.open(AddressBookDialog, dialogConfig)
      : this.dialog.open(AddressDialog, dialogConfig);

    dialogRef.afterClosed().subscribe(() => {
      this.cdr.detectChanges();
    });
  }
  
  protected openBottomSheet() {
    this.bottomSheet.open(NotificationBottomSheet);
  }

  protected onClickHome() {
    this.router.navigate(['/']);
  }
};