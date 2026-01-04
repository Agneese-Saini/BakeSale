import { Component, Inject, ChangeDetectorRef, Input } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatDialogConfig, MatDialogModule } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { IItem, Item } from "../content/item";
import { ItemDialog, PriceTag } from "../content/itemDialog";
import { Cart, CartService } from "./cart";
import { ItemChoiceSummary } from "../content/itemChoice";


@Component({
  selector: 'cart-item-list',
  imports: [FormsModule, FontAwesomeModule, ItemChoiceSummary, PriceTag],
  template: `
<div class="flex flex-col">
    @for (item of items; track item) {
    <div class="flex justify-between items-center p-2">
      <div class="flex gap-2 items-center w-full">
        <img class="rounded-box w-12 h-12" [src]="getImage(item)"/>

        <div class="flex-1">
          @if (numChoices(item) > 0) {
          <div class="collapse collapse-arrow">
            <input type="checkbox" />

            <div class="collapse-title flex flex-col p-1">
              <div class="flex gap-2 items-center">
                <h1>
                  {{ item.name }}
                  @if (item.price.buyOneGetOne) {
                  <b>({{ item.amount * 2 }})</b>
                  }
                </h1>
              </div>

              <item-price-tag [value]="item" [showSale]="true" size="sm"></item-price-tag>

              <p class="label text-xs">{{ numChoices(item) }} choice(s)</p>
            </div>

            <div class="collapse-content">
              <item-choice-summary [value]="item.choices"></item-choice-summary>
              <br />

              <button class="btn btn-neutral btn-xs" (click)="openItemDialog(item)">
                <fa-icon icon="pencil"></fa-icon> Edit Order
              </button>
            </div>
          </div>
          }
          @else {
          <a class="link flex flex-col p-1" style="text-decoration: none;" (click)="openItemDialog(item)">
            <div class="flex gap-2 items-center">
              <h1>
                {{ item.name }}
                @if (item.price.buyOneGetOne) {
                <b>({{ item.amount * 2 }})</b>
                }
              </h1>
            </div>

            <item-price-tag [value]="item" [showSale]="true" size="sm"></item-price-tag>
          </a>
          }
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button class="btn btn-ghost btn-circle" (click)="decrease(item)">
          @if (item.amount == 1) {
          <fa-icon class="text-error" icon="trash"></fa-icon>
          } @else {
          <fa-icon icon="minus"></fa-icon>
          }
        </button>

        <b class="text-lg">{{ item.amount }}</b>

        <button class="btn btn-ghost btn-circle" (click)="increase(item)">
          <fa-icon icon="plus"></fa-icon>
        </button>
      </div>
    </div>

    <div class="divider m-0 px-12"></div>
  }
</div>
`
})
export class CartItemList {

  @Input({ required: true })
  public items?: IItem[];

  constructor(
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private cartService: CartService) { }

  protected ngOnInit() { }

  protected getImage = Item.getImage;

  protected increase(item: IItem) {
    const currentAmount = Item.getAmount(item);
    const newAmount = currentAmount + 1;

    let maxAmount = item.maxAmount ? item.maxAmount : Item.DefaultMaxAmount;
    if (item.stockAmount != undefined && item.stockAmount < maxAmount) {
      maxAmount = item.stockAmount;
    }

    if (newAmount <= maxAmount) {
      item.amount = newAmount;
      this.cartService.addToCart(item);
    }
    else {
      let message: string;

      if (item.stockAmount != undefined && item.stockAmount == maxAmount) {
        message = "Only " + item.stockAmount + " left in stock!";
      } else {
        message = "Max " + maxAmount + " items allowed!";
      }

      this.snackBar.open(message, "Close", {
        duration: 2500
      });
    }
  }

  protected decrease(item: IItem) {
    const currentAmount = Item.getAmount(item);
    if (currentAmount == 1) {
      // remove from cart
      this.cartService.removeFromCart(item);

      const message = item.name + ": was removed from your cart.";
      const snackBarRef = this.snackBar.open(message, "Undo", {
        duration: 2500
      });

      snackBarRef.onAction().subscribe(action => {
        this.cartService.addToCart(item);
      });
    }
    else {
      const newAmount = currentAmount - 1;
      item.amount = newAmount;
      this.cartService.addToCart(item);
    }
  }

  protected openItemDialog(item: IItem) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = "";
    dialogConfig.data = item;

    const dialogRef = this.dialog.open(ItemDialog, dialogConfig);

    dialogRef.afterClosed().subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  protected getAmount = Item.getAmount;
  protected getPrice = Item.getPrice;
  protected numChoices = Item.numChoices;
};


@Component({
  imports: [FormsModule, FontAwesomeModule, CartItemList, MatDialogModule],
  template: `
<div class="bg-base-200 p-4">
  <div mat-dialog-title>
    <h1 class="label">Your shopping cart ({{ data.name }}):</h1>
  </div>

  <div mat-dialog-content>
    <div class="bg-base-100 rounded-box h-94 overflow-y-auto p-2">
      <cart-item-list [items]="items" />    
    </div>
  </div>
  <br />

  <div mat-dialog-actions>    
    <div class="grid gap-2">
      <button class="btn btn-neutral" (click)="closeDialog()">Close</button>
    </div>
  </div>
</div>
`
})
export class CartItemsDialog {

  protected shoppingCart: Cart = new Map();

  protected get items(): IItem[] | undefined {
    return this.shoppingCart.get(this.data.name);
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) protected data: IItem,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<CartItemsDialog>,
    private snackBar: MatSnackBar,
    private cartService: CartService,
    private cdr: ChangeDetectorRef) { }

  protected ngOnInit() {
    this.cartService.shoppingCart$.subscribe(data => {
      this.shoppingCart = data;
      this.cdr.detectChanges();
    });
  }

  protected openItemDialog(item: IItem) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = "";
    dialogConfig.data = item;

    const dialogRef = this.dialog.open(ItemDialog, dialogConfig);

    dialogRef.afterClosed().subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  protected removeItem(item: IItem) {
    this.cartService.removeFromCart(item);

    const message = item.name + ": was removed from your cart.";
    const snackBarRef = this.snackBar.open(message, "Undo", {
      duration: 2500
    });

    snackBarRef.onAction().subscribe(() => {
      this.cartService.addToCart(item);
      this.cdr.detectChanges();
    });
  }

  protected closeDialog() {
    this.dialogRef.close();
  }
};