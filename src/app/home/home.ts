import { ChangeDetectorRef, Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { HomeHeader } from "../header/home-header";
import { DatePipe } from '@angular/common';
import { AutoComplete } from "../header/googleMaps";
import { IAddress } from '../header/addressDialog';
import { UserService } from '../user/user';
import { AddressBook, DeliveryMode, DeliveryService, IDeliverySettings } from '../header/addressBook';

export interface IPartner {
  img: string, 
  label: string,
  joinDate: string,
  rating: number,
  ratingCount: number,
  comment?: string
};

@Component({
  selector: 'app-home',
  imports: [FontAwesomeModule, RouterModule, HomeHeader, DatePipe, AutoComplete],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {

  protected readonly PartnersList: IPartner[] = [
    {
      img: "https://www.gunnsbakery.com/wp-content/uploads/Gunns-Bakery-Logo-closed-with-white-bg-300x185.png", 
      label: "Gunns Bakery",
      joinDate: Date(),
      rating: 4.5,
      ratingCount: 455
    }, 
    {
      img: "https://goodiesbakeshop.com/wp-content/uploads/2021/08/Goodies-Logo-e1630347378677.png", 
      label: "Goodies",
      joinDate: Date(),
      rating: 4.2,
      ratingCount: 455
    }
  ];

  protected deliverySettings: IDeliverySettings = AddressBook.DefaultSettings;
  protected enteredAddress?: IAddress;

  constructor(
    private router: Router,
    private deliveryService: DeliveryService,
    private cdr: ChangeDetectorRef) { }

  protected ngOnInit() {
    this.deliveryService.deliverySettings$.subscribe(data => {
      this.deliverySettings = data;
      this.cdr.detectChanges();
    });
  }

  protected onAutoCompleteSelect(params: { address: IAddress, prediction: string }) {
    this.enteredAddress = {
      label: params.address.label,
      addressLine: params.address.addressLine,
      city: params.address.city,
      province: params.address.province,
      postal: params.address.postal
    };
  }

  protected onAutoCompleteChange(numResults: number) {
    if (numResults == 0) {
      this.enteredAddress = undefined;
    }
  }

  protected onOrderOnline() {
    if (this.enteredAddress != undefined) {
      this.deliveryService.addAddress(this.enteredAddress);

      // Change current address
      this.deliverySettings.address = this.enteredAddress;
    }

    // Change current mode to delivery
    this.deliverySettings.mode = DeliveryMode.Delivery;    
    this.deliveryService.setDeliverySetting(this.deliverySettings);

    this.router.navigate(['/shop']);
  }

  protected onOrderPickup() {
    // Find a nearby pickup
    if (this.enteredAddress != undefined) {
    }

    // Change current mode to pickup
    this.deliverySettings.mode = DeliveryMode.Pickup;
    this.deliveryService.setDeliverySetting(this.deliverySettings);

    this.router.navigate(['/shop']);
  }
}
