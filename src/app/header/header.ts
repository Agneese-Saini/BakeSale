import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AddressBook, DeliveryService, IDeliverySettings, DeliverySwitch, AddressBookDialog } from './delivery';
import { CartService, Cart, EmptyCartLinks } from '../checkout/cart';
import { Category, CategoryList, CategoryService, ICategory } from './category';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DecimalPipe, KeyValuePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SideDrawer } from '../sidedrawer/sidedrawer';
import { CheckoutDrawer } from '../checkout/checkout-drawer';
import { CartItemList } from '../checkout/cartItemDialog';
import { IUser, UserRole, UserService } from '../user/user';


@Component({
  selector: 'app-logo',
  imports: [FormsModule, FontAwesomeModule],
  template: `
@switch (style) {
@case (0) {
<a class="link text-2xl font-serif" style="text-decoration: none" (click)="click.emit();">
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
  public click = new EventEmitter<void>();

};


@Component({
  selector: 'search-bar',
  imports: [FormsModule, FontAwesomeModule, CategoryList],
  template: `

<fieldset class="fieldset">
  <label class="input w-full">
    <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <g stroke-linejoin="round" stroke-linecap="round" stroke-width="2.5" fill="none" stroke="currentColor">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.3-4.3"></path>
      </g>
    </svg>
    <input type="search" class="w-full lg:min-w-84" placeholder="Search BakeSale" />
  </label>

  @if (categoryMenu) {
  <div class="dropdown px-4">
    Search in <i tabindex="0" role="button" class="link w-54"><u>{{ getFilterLabel() }} <fa-icon
          icon="filter"></fa-icon></u></i>
    <ul tabindex="0" class="dropdown-content menu bg-base-300 rounded-box z-50 w-65 p-2 shadow-2xl">
      <category-list />
    </ul>
  </div>
  }
</fieldset>

`
})
export class SearchBar {

  protected categories: ICategory[] = [];

  @Input()
  protected categoryMenu: boolean = true;

  constructor(
    private categoryService: CategoryService,
    private cdr: ChangeDetectorRef) { }

  protected ngOnInit() {
    this.categoryService.categories$.subscribe(data => {
      this.categories = data;
      this.cdr.detectChanges();
    });
  }

  private getSelectedCategories() {
    let selected = [];
    for (let cat of this.categories) {
      if (cat.checked || Category.isPartiallyChecked(cat)) {
        selected.push(cat);
      }
    }
    return selected;
  }

  protected getFilterLabel() {
    const toatlCount = this.categories.length;
    const selectedCount = this.getSelectedCategories().length;

    if (selectedCount == 1) {
      return this.getSelectedCategories()[0].name;
    }

    if (selectedCount == toatlCount) {
      return "All Departments";
    }

    if (selectedCount > 0) {
      return selectedCount + " Departments";
    }

    return "Home";
  }

};


@Component({
  selector: 'app-header',
  imports: [FormsModule, FontAwesomeModule, DeliverySwitch, RouterModule, SearchBar, AddressBook, Logo],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {

  protected appDrawer = SideDrawer.name;
  protected checkoutDrawer = CheckoutDrawer.name;
  protected userRole = UserRole;

  protected deliverySettings: IDeliverySettings = AddressBook.DefaultSettings;
  protected shoppingCart: Cart = new Map();
  protected user: IUser = UserService.DefaultUser;

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

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private deliveryService: DeliveryService,
    private cartService: CartService,
    private userService: UserService,
    private cdr: ChangeDetectorRef) { }

  protected ngOnInit() {
    this.deliveryService.deliverySettings$.subscribe(data => {
      this.deliverySettings = data;
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

    const dialogRef = this.dialog.open(AddressBookDialog, dialogConfig);

    dialogRef.afterClosed().subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  protected onClickHome() {
    this.deliverySettings.category = undefined;
    this.deliverySettings.showHomepage = true;
    this.deliveryService.setDeliverySetting(this.deliverySettings);

    this.router.navigate(['/']);
  }
};