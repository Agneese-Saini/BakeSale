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
  @for (item of items; track $index) {
  <div [class]="'flex flex-col p-1' + ' ' + background">
    <div class="flex justify-between items-center p-2">
      <div class="flex gap-2 items-center w-full">
        <div class="flex gap-2 items-center p-0">
          <img class="flex-noshrink link rounded-box w-12 h-12" [src]="getImage(item)" (click)="openItemDialog(item)" />

          <span class="flex flex-col">
            <a class="link font-semibold" style="text-decoration: none;" (click)="openItemDialog(item)">
              {{ item.name }}
              @if (item.price.buyOneGetOne) {
              <b>({{ item.amount * 2 }})</b>
              }
            </a>

            <item-price-tag [value]="item" [showSale]="true" size="xs" saleSize="xs"></item-price-tag>
          </span>
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


    @if (numChoices(item) > 0) {
    <div class="collapse bg-base-200 rounded-none px-2">
      <input type="checkbox" />

      <div class="collapse-title p-0 flex justify-center">
        @let num = numChoices(item);
        <p class="font-medium label text-xs">
          {{ num }} {{ num == 1 ? 'choice' : 'choices' }} &bull; <b>{{ '$' }}{{ getChoicesPrice(item) }}</b>
        </p>
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
  </div>
  }
</div>
`
})
export class CartItemList {

  protected numChoices = Item.numChoices;
  protected getChoicesPrice = Item.getChoicesPrice;
  protected getPrice = Item.getPrice;
  protected getImage = Item.getImage;

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

};