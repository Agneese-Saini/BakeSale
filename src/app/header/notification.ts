import { Component } from "@angular/core";
import { MatBottomSheetRef } from "@angular/material/bottom-sheet";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { IUser, UserService } from "../user/user";

export enum NotifictionType {
    Suggestion,
    ThumbsUp,
    Review,
    OrderPlaced,
    OrderReady,
    OrderPicked,
    OrderDelivered,
};

export interface INotification {
    type: NotifictionType,
    name: string,
    icon?: string,
    image?: string,
    notes?: string[],
    link?: string
};

@Component({
    imports: [FontAwesomeModule],
    template: `
<ul class="list bg-base-100 rounded-box shadow-md max-h-92 overflow-y-auto">
  <li class="p-4 pb-2 text-sm opacity-60 tracking-wide">Notifications</li>
  
  @for (notify of notifys; track $index) {
  <li class="list-row">
  @switch (notify.type) {
  @case (notificationType.OrderDelivered) {
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
  }
  }
  </li>
  }

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
      <fa-icon class="text-xl text-success" icon="clipboard-check"></fa-icon>
    </div>
    <div>
      <div><a class="link font-bold" style="text-decoration: none;">Order Placed</a> for 4 items.</div>
      <div class="text-xs text-gray-500">An order for <b>$78.50</b> was placed for Delivery.</div>
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

    protected notificationType = NotifictionType;

    private user: IUser = UserService.DefaultUser;

    protected get notifys() {
        return this.user.notifications;
    }

    constructor(
        private bottomSheetRef: MatBottomSheetRef<NotificationBottomSheet>,
        private userService: UserService) { }

    protected ngOnInit() {
        this.userService.user$.subscribe(data => {
            this.user = data;
        });
    }

    protected openLink(event: MouseEvent) {
        this.bottomSheetRef.dismiss();
        event.preventDefault();
    }

    protected getNumItems(note: INotification) {
        return note.notes ? note.notes[0] : '';
    }

    protected getPrice(note: INotification) {
        if (note.type == NotifictionType.OrderPlaced) {
            return note.notes ? note.notes[1] : 'n/a';
        }

        return note.notes ? note.notes[0] : 'n/a';
    }

    protected getImage(note: INotification) {
        switch (note.type) {
            case NotifictionType.OrderDelivered:
            case NotifictionType.OrderPicked:
            case NotifictionType.OrderReady:
            case NotifictionType.OrderPlaced: {
                return note.icon;
            }
        }

        return note.image;
    }
}