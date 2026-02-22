import { DatePipe, DecimalPipe, KeyValuePipe } from "@angular/common";
import { ChangeDetectorRef, Component, Input } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ItemChoiceSummary } from "../content/itemChoice";
import { UserService } from "./user";
import { IOrderHistory } from "./order-history";
import { Item } from "../content/item";
import { CartService } from "../checkout/cart";
import { DeliveryType } from "../header/addressBook";
import { Receipt } from "../custom/receipt";

@Component({
  selector: 'order-items',
  imports: [FormsModule, FontAwesomeModule, RouterModule, DecimalPipe, KeyValuePipe, ItemChoiceSummary],
  template: `
@if (order) {
<table class="table">
  <tbody>
    @for (items of order.cart | keyvalue; track $index) {
    @for (item of items.value; track $index) {
    <tr>
      <td>
        <div class="flex items-center justify-between">
          <div class="flex gap-4 items-center w-full">            
            <img class="rounded-box w-12 h-12" [src]="getImage(item)" />
            <div class="flex-1">
              <div class="collapse">
                @if (numChoices(item) > 0) {
                <input type="checkbox" [checked]="open"/>
                }
                
                <div [class]="'grid p-1 ' + (numChoices(item) > 0 ? 'collapse-title' : '')">
                  <div class="flex gap-2 items-center">
                    <h1 class="text-lg">
                      {{ item.name }}
                      @if (item.price.buyOneGetOne) {
                      <b>({{ item.amount }})</b>
                      }
                    </h1>
                    @if (item.amount > 1) {
                    <span class="bg-base-100 px-2 border border-base-300">{{ item.amount }}</span>
                    }
                  </div>

                  @if (item.price.buyOneGetOne) {
                  <span class="label text-xs font-mono">[Buy 1, Get 1]</span>
                  } @else if (item.price.label) {
                  <span class="label text-xs font-mono">[{{ item.price.label }}]</span>
                  }

                  @if (numChoices(item) > 0) {
                  <p class="label text-xs">{{ numChoices(item) }} choice(s)</p>
                  }
                </div>

                @if (numChoices(item) > 0) {
                <div class="collapse-content p-0 px-1">
                  <item-choice-summary [value]="item.choices"></item-choice-summary>
                </div>
                }
              </div>
            </div>
          </div>
          
          @if (!hidePrice) {
          <div class="flex flex-col items-end">
            <div class="flex gap-2 items-center">
              @if (!item.price.buyOneGetOne && item.price.previousPrice) {
              <p class="label line-through text-xs">{{ "$" }}{{ getPrice(item, item.price.previousPrice) | number: '1.2-2' }}</p>
              }
              <p>{{ "$" }}{{ getPrice(item, item.price.value) | number: '1.2-2' }}</p>
            </div>
          </div>
          }
        </div>
      </td>
    </tr>
    }
    }
  </tbody>
</table>
}
`
})
export class OrderItems {

  @Input({ required: true })
  public order?: IOrderHistory;

  @Input()
  public open: boolean = false;

  @Input()
  public hidePrice: boolean = false;

  protected numChoices = Item.numChoices;
  protected getImage = Item.getImage;
  protected getPrice = Item.getPrice;
};


@Component({  
  selector: 'view-receipt',
  imports: [FormsModule, FontAwesomeModule, RouterModule, OrderItems, Receipt, DatePipe],
  templateUrl: "view-receipt.html"
})
export class ViewReceipt {

  protected deliveryType = DeliveryType;

  protected order?: IOrderHistory;

  protected get totalItems() {
    return this.order ? CartService.totalItems(this.order.cart) : 0;
  }

  protected get currentDate(): Date {
      return new Date();
  }

  constructor(
    private route: ActivatedRoute,
    private service: UserService,
    private cdr: ChangeDetectorRef) { }

  protected ngOnInit() {
    this.service.user$.subscribe(data => {
      if (data.orders) {
        const param = this.route.snapshot.paramMap.get('date');
        const date = param ? +param : 0;

        for (let order of data.orders) {
          if (order.date == date) {
            this.order = order;
            break;
          }
        }
      }

      this.cdr.detectChanges();
    });
  }

  protected getLastFourDigits(cardNumber: string): string {
    return cardNumber.slice(-4);
  }
}