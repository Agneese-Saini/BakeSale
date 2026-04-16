import { Component } from "@angular/core";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { PageHeader } from "../header/page-header";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { OrderService } from "./checkout";
import { IOrderHistory } from "../user/order-history";

@Component({
  selector: 'order-placed',
  imports: [FontAwesomeModule, RouterModule, PageHeader],
  template: `
<page-header></page-header>

<div class="bg-base-300 h-2 my-2"></div>

<div class="flex flex-col items-center justify-center text-center py-32 px-6">
  <!-- Cart Icon -->
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="green" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M9 12l2 2 4-4"></path>
    </svg>

  <!-- Message -->
  <h2 class="text-2xl font-semibold text-gray-900">Order Placed</h2>
  <p class="text-gray-500 mt-2 mb-6 max-w-sm">
    Your order has been confirmed and is being prepared.<br/>
    Your order id is <b>#{{ order ? order.id : 'Unknown' }}</b>.
  </p>

  <!-- Action Button -->
  <div class="flex flex-col gap-2">
    <a routerLink="/order-history" class="btn btn-success btn-soft">
      Track Your Order
    </a>
    <a routerLink="/shop" class="btn">
      Back to Shopping
    </a>
  </div>
</div>
`
})
export class OrderPlaced {

  protected order?: IOrderHistory;

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    private router: Router) { }

  protected ngOnInit() {
    const orderId = this.route.snapshot.paramMap.get('id')?.toLowerCase().trim();

    if (orderId == undefined) {      
      this.router.navigate(['/404']);
      return;
    }

    this.orderService.orders$.subscribe(data => {
      this.order = data.find(value => (value.id == orderId));
      if (this.order == undefined) {
        this.router.navigate(['/404']);
      }
    });
  }
}