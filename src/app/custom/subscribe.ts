import { KeyValuePipe } from "@angular/common";
import { ChangeDetectorRef, Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { Category, CategoryService, Customizer, ICategory } from "../header/category";
import { IItem, Item } from "../content/item";
import { MatDialog, MatDialogConfig, MatDialogModule } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { IPayMethod } from "../user/user";
import { IAddress } from "../header/addressDialog";
import { SubscribeItemList } from "./subscribeItemList";
import { CheckoutDialog, Receipt } from "../checkout/receipt";

export interface ISubscription {
  category: ICategory,
  freq: number,
  days: DaysOfWeekSetting,
  address?: IAddress,
  canceledDays?: Date[],
  date?: Date,
  payment?: IPayMethod
};

export enum DaysOfWeek {
  Monday,
  Tuesday,
  Wednessday,
  Thursday,
  Friday,
  Saturday,
  Sunday
};

export type DaysOfWeekSetting = Map<DaysOfWeek, { name: string, checked: boolean, label: string }>;

@Component({
  selector: 'subscribe',
  imports: [FormsModule, FontAwesomeModule, RouterModule, KeyValuePipe, MatDialogModule, SubscribeItemList],
  templateUrl: "subscribe.html"
})
export class Subscribe {

  static readonly MinimumItemCount = 2;

  protected readonly numDaysLimit: number = 5;
  protected readonly defaultCategory = Category.DefaultCategory;

  protected readonly deliveryFrequencies: number[] = [
    1, 2, 3, 4
  ];

  protected daysOfWeekSetting: DaysOfWeekSetting = new Map([
    [DaysOfWeek.Monday, { name: "Monday", checked: false, label: "MON" }],
    [DaysOfWeek.Tuesday, { name: "Tuesday", checked: false, label: "TUE" }],
    [DaysOfWeek.Wednessday, { name: "Wednessday", checked: false, label: "WED" }],
    [DaysOfWeek.Thursday, { name: "Thursday", checked: false, label: "THU" }],
    [DaysOfWeek.Friday, { name: "Friday", checked: false, label: "FRI" }],
    [DaysOfWeek.Saturday, { name: "Saturday", checked: false, label: "SAT" }],
    [DaysOfWeek.Sunday, { name: "Sunday", checked: false, label: "SUN" }]
  ]);

  protected category?: ICategory;
  protected selectedItemsError?: string;
  protected selectedDeliveryFrequency: number = this.deliveryFrequencies[0];
  protected selectedDeliveryDaysError?: string;

  protected get totalSelectedItems(): number {
    let num: number = 0;
    if (this.category) {
      for (let item of SubscribeItemList.getSelectedItems(this.category)) {
        num += item.amount;
      }
    }
    return num;
  }

  protected get selectedDeliveryDays(): DaysOfWeekSetting {
    let ret: DaysOfWeekSetting = new Map();
    for (let [key, value] of this.daysOfWeekSetting) {
      if (value.checked) {
        ret.set(key, value);
      }
    }

    return ret;
  }

  protected get selectedDays(): string {
    const last = [...this.selectedDeliveryDays.keys()].at(-1);

    let ret: string = "";
    for (let [key, value] of this.selectedDeliveryDays) {
      ret += value.label;
      if (key != last) {
        ret += ", ";
      }
    }

    return ret;
  }

  protected get numDays(): number {
    let num: number = 0;
    for (let [key, value] of this.daysOfWeekSetting) {
      num += value.checked ? 1 : 0;
    }
    return num;
  }

  constructor(
    private route: ActivatedRoute,
    private categoryService: CategoryService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef) { }

  protected ngOnInit() {
    const type = this.route.snapshot.paramMap.get('type');
    if (type == 'bread') {
      this.categoryService.categories$.subscribe(data => {
        for (let cat of data) {
          let find = this.findCustomizer(cat, Customizer.Subscription);
          if (find != undefined) {
            this.category = structuredClone(find);
            break;
          }
        }

        this.cdr.detectChanges();
      });
    }
  }

  protected findCustomizer(category: ICategory, customizer: Customizer): ICategory | undefined {
    if (category.customizer && category.customizer == customizer) {
      return category;
    }

    if (category.subcats) {
      for (let subcat of category.subcats) {
        const find = this.findCustomizer(subcat, customizer);
        if (find != undefined) {
          return find;
        }
      }
    }

    return undefined;
  }

  protected onDaysChange() {
    this.selectedDeliveryDaysError = undefined;
  }

  protected proceed() {
    if (!this.category) return;

    if (this.totalSelectedItems < Subscribe.MinimumItemCount) {
      this.selectedItemsError = "Minimum Required " + Subscribe.MinimumItemCount;
    }

    if (this.selectedDeliveryDays.size == 0) {
      this.selectedDeliveryDaysError = "Required";
    }

    if (this.selectedItemsError || this.selectedDeliveryDaysError) {
      this.snackBar.open("Please fix errors before proceeding.", "Close", {
        duration: 2500
      });
      return;
    }

    const data: ISubscription = {
      category: this.category,
      days: this.selectedDeliveryDays,
      freq: this.selectedDeliveryFrequency
    };

    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = "";
    dialogConfig.data = data;
    dialogConfig.width = '90%';

    const dialogRef = this.dialog.open(CheckoutDialog, dialogConfig);
    dialogRef.afterClosed().subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  static getTotalItems(items: IItem[]): number {
    let num: number = 0;
    for (let item of items) {
      num += item.amount;
    }
    return num;
  }

  static getSubTotal(items: IItem[]): number {
    let subtotal: number = 0;
    for (let item of items) {
      subtotal += Item.getPrice(item);
    }
    return subtotal;
  }

  static getSavings(items: IItem[]): number {
    let originalTotal: number = 0;
    for (let item of items) {
      originalTotal += Item.getPrice(item, item.price.previousPrice ? item.price.previousPrice : item.price.value);
    }
    return originalTotal - Subscribe.getSubTotal(items);
  }

  static getTaxes(items: IItem[]): number {
    const subtotal = Subscribe.getSubTotal(items);
    const GST = subtotal * (Receipt.GST_Rate / 100);
    const PST = subtotal * (Receipt.PST_Rate / 100);
    return GST + PST;
  }

  static getServiceFee(items: IItem[]): number {
    const totalItems = Subscribe.getTotalItems(items);
    return 0.65 * totalItems * ((totalItems > 4) ? 0.83 : 1.0);
  }

  static getDeliveryFee(sub: ISubscription): number {
    return 0.0;
  }

  static getTotal(items: IItem[]): number {
    return Subscribe.getSubTotal(items) + Subscribe.getServiceFee(items) + Subscribe.getTaxes(items);
  }
}