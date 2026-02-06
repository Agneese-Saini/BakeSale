import { Component, Input, ChangeDetectorRef } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { IItem, Item } from "../content/item";
import { ItemChoiceSummary } from "../content/itemChoice";
import { PriceTag, ItemDialog } from "../content/itemDialog";
import { CartService } from "./cart";

@Component({
  selector: 'cart-item-list',
  imports: [FormsModule, FontAwesomeModule, ItemChoiceSummary, PriceTag],
  template: `
<div class="flex flex-col gap-1">
    @for (item of items; track item) {
    <div [class]="'flex justify-between items-center p-2' + ' ' + background">
      <div class="flex gap-2 items-center w-full">

        <div class="flex-1">
          @if (numChoices(item) > 0) {
          <div class="collapse">
            <input type="checkbox" />

            <div class="collapse-title flex gap-2 items-center p-0">
              <img class="rounded-box w-12 h-12" [src]="getImage(item)"/>

              <div class="flex flex-col">
                <div class="flex gap-2 items-center">
                  <h1>
                    {{ item.name }}
                    @if (item.price.buyOneGetOne) {
                    <b>({{ item.amount * 2 }})</b>
                    }
                  </h1>
                </div>

                <item-price-tag [value]="item" [showSale]="true" size="sm" saleSize="xs"></item-price-tag>

                <p class="label text-xs">{{ numChoices(item) }} choice(s)</p>
              </div>
            </div>

            <div class="collapse-content p-1">
              <item-choice-summary [value]="item.choices"></item-choice-summary>
              <br />

              <button class="btn btn-neutral btn-xs" (click)="openItemDialog(item)">
                <fa-icon icon="pencil"></fa-icon> Edit Order
              </button>
            </div>
          </div>
          }
          @else {
          <a class="link flex gap-2 items-center p-0" style="text-decoration: none;" (click)="openItemDialog(item)">
            <img class="rounded-box w-12 h-12" [src]="getImage(item)"/>

            <span class="flex flex-col">
              <div class="flex gap-2 items-center">
                <h1>
                  {{ item.name }}
                  @if (item.price.buyOneGetOne) {
                  <b>({{ item.amount * 2 }})</b>
                  }
                </h1>
              </div>

              <item-price-tag [value]="item" [showSale]="true" size="sm" saleSize="xs"></item-price-tag>
            </span>
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
  }
</div>
`
})
export class CartItemList {

  @Input({ required: true })
  public items?: IItem[];

  @Input()
  public background: string = "bg-base-100";

  constructor(
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private cartService: CartService) { }

  protected ngOnInit() { }

  protected getImage = Item.getImage;

  protected increase(item: IItem) {
    const currentAmount = Number(item.amount);
    const newAmount = currentAmount + 1;

    let maxAmount = item.maxAmount != undefined ? item.maxAmount : Item.DefaultMaxAmount;
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
    const currentAmount = Number(item.amount);
    if (currentAmount == 1) {
      // remove from cart
      this.cartService.removeFromCart(item);

      const message = item.name + " was removed from your cart.";
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
    dialogConfig.width = '90%';

    const dialogRef = this.dialog.open(ItemDialog, dialogConfig);

    dialogRef.afterClosed().subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  protected getPrice = Item.getPrice;
  protected numChoices = Item.numChoices;
};