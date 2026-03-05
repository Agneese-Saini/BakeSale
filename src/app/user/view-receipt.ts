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
import { AddressBook, DeliveryType } from "../header/addressBook";
import { Receipt } from "../checkout/receipt";

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
          <div class="flex-1">
              <div class="collapse">
                <input type="checkbox" />

                <div class="collapse-title flex gap-2 items-center p-0">
                  @if (showImage == true) {
                  <img class="rounded-box w-12 h-12" [src]="getImage(item)"/>
                  }

                  <div class="flex-1 flex justify-between w-full">
                    <div class="flex flex-col">
                      <h1>
                        {{ item.name }}
                        @if (item.price.buyOneGetOne) {
                        <b>({{ item.amount * 2 }})</b>
                        }
                      </h1>

                      @if (numChoices(item) > 0) {
                      @let num = numChoices(item);
                      <p class="font-medium label text-xs">
                        {{ num }} {{ num == 1 ? 'choice' : 'choices' }}&nbsp;
                        @if (!hidePrice) {
                        &bull; <b>{{ '$' }}{{ getChoicesPrice(item) }}</b>
                        }
                      </p>
                      }
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
                </div>

                <div class="collapse-content p-1">
                  @if (numChoices(item) > 0) {
                  <item-choice-summary [value]="item.choices"></item-choice-summary>
                  <br />
                  }

                  @if (!hidePrice) {
                  <a class="link" [routerLink]="['/item', {category: item.parent, item: item.name}]">
                    <fa-icon icon="arrow-up-right-from-square"></fa-icon> View Item
                  </a>
                  }
                </div>
              </div>
          </div>
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
  public showImage: boolean = true;

  @Input()
  public hidePrice: boolean = false;

  protected numChoices = Item.numChoices;
  protected getChoicesPrice = Item.getChoicesPrice;
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

  protected printAddress = AddressBook.printAddress;

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