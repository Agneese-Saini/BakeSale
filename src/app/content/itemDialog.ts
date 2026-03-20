import { Component, forwardRef, Inject, Input } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DecimalPipe, KeyValuePipe } from "@angular/common";
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule, MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { IItem, Item, PriceTag, TextReadMore } from "./item";
import { CartService } from "../checkout/cart";
import { RouterModule } from "@angular/router";
import { ItemChoiceList } from "./itemChoice";

@Component({
  imports: [FormsModule, FontAwesomeModule, RouterModule, ItemChoiceList, KeyValuePipe, DecimalPipe, forwardRef(() => TextReadMore), forwardRef(() => PriceTag), MatDialogModule],
  templateUrl: './itemDialog.html'
})
export class ItemDialog {

  public readonly defaultMaxAmount = Item.DefaultMaxAmount;

  protected item: IItem;
  protected displayImage?: string;

  protected getImage = Item.getImage;
  protected getPrice = Item.getPrice;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: IItem,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<ItemDialog>,
    private snackBar: MatSnackBar,
    private cartService: CartService) {

    this.item = structuredClone(data);
  }

  protected ngOnInit() {
    this.displayImage = Item.getImage(this.item);

    // Reset errors
    if (this.item.choices) {
      for (let [key, value] of this.item.choices.entries()) {
        key.error = undefined;
      }
    }
  }

  protected selectImage(image: string) {
    this.displayImage = image;
  }

  protected checkForErrors(): boolean {
    if (this.item.choices) {
      for (let [key, value] of this.item.choices) {
        ItemChoiceList.ShowError(key, value);
      }

      for (let [key, value] of this.item.choices) {
        if (ItemChoiceList.HasError(key, value, false)) {
          this.snackBar.open("Please fix the errors before adding to cart.", "Close", {
            duration: 2500
          });
          return true;
        }
      }
    }

    if (this.item.stockAmount != undefined && this.item.stockAmount < Item.getAmount(this.item)) {
      this.snackBar.open("Only " + this.item.stockAmount + " left in stock, please select upto the limit.", "Close", {
        duration: 2500
      });
      return true;
    }

    return false;
  }

  protected saveToCart() {
    if (this.checkForErrors()) {
      return;
    }

    // add or update cart
    this.cartService.addToCart(this.item);

    const message = this.item.name + " was changed in your cart.";
    this.snackBar.open(message, "Close", {
      duration: 2500
    });

    this.dialogRef.close();
  }

  protected removeFromCart() {
    // remove from cart
    this.cartService.removeFromCart(this.data);

    const message = this.item.name + " was removed from your cart.";
    const snackBarRef = this.snackBar.open(message, "Undo", {
      duration: 2500
    });

    snackBarRef.onAction().subscribe(action => {
      this.cartService.addToCart(this.data);
    });

    this.dialogRef.close();
  }

  protected duplicate() {
    let newItem = structuredClone(this.data);
    newItem.id = undefined;
    this.cartService.addToCart(newItem);

    const message = this.item.name + ": duplicate order added.";
    this.snackBar.open(message, "Close", {
      duration: 2500
    });

    this.dialogRef.close();
  }

  protected cancel() {
    this.dialogRef.close();
  }

  protected closeAll() {
    this.dialog.closeAll();
  }

  protected list(limit: number): number[] {
    return ItemDialog.numberList(1, limit);
  };

  static numberList(start: number, end: number): number[] {
    let ret: number[] = [];

    if (start > end) return ret;

    if (start == end) {
      ret.push(start);
      return ret;
    }

    for (let i = start; i <= end; i++) {
      ret.push(i);
    }
    return ret;
  };
};