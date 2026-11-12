import { ChangeDetectorRef, Component, Pipe, PipeTransform } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { HomeHeader } from "../header/home-header";
import { DatePipe } from '@angular/common';
import { AutoComplete } from "../header/googleMaps";
import { IAddress } from '../header/addressDialog';
import { AddressBook, DeliveryMode, DeliveryService, IDeliverySettings } from '../header/addressBook';

export interface IPartner {
  img: string, 
  label: string,
  joinDate: string,
  rating: number,
  ratingCount: number,
  isUser?: boolean,
  comment?: string
};

@Pipe({
  name: 'shortNumber',
  standalone: true
})
export class ShortNumberPipe implements PipeTransform {
  transform(value: number): string {
    if (!value && value !== 0) return '';
    
    // Uses browser-native Intl API for K, M, B abbreviations
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1
    }).format(value);
  }
}

@Component({
  selector: 'app-home',
  imports: [FontAwesomeModule, RouterModule, HomeHeader, DatePipe, AutoComplete, ShortNumberPipe],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {

  protected readonly ItemsPerPage = 3;

  protected readonly PartnersList: IPartner[] = [
    {
      img: "https://www.gunnsbakery.com/wp-content/uploads/Gunns-Bakery-Logo-closed-with-white-bg-300x185.png", 
      label: "Gunns Bakery",
      joinDate: Date(),
      rating: 4.5,
      ratingCount: 805
    }, 
    {
      img: "https://goodiesbakeshop.com/wp-content/uploads/2021/08/Goodies-Logo-e1630347378677.png", 
      label: "Goodies",
      joinDate: Date(),
      rating: 4.2,
      ratingCount: 1055
    }, 
    {
      img: "https://img.daisyui.com/images/profile/demo/1@94.webp", 
      label: "Cindy",
      joinDate: Date(),
      rating: 3.5,
      ratingCount: 25,
      isUser: true
    }
  ];

  protected deliverySettings: IDeliverySettings = AddressBook.DefaultSettings;
  protected enteredAddress?: IAddress;

  protected currentPage: number = 1;

  protected get TotalPages() {
    return Math.ceil(this.PartnersList.length / this.ItemsPerPage);
  }

  protected get totalPages() {
    let array: number[] = [];
    for (let i = 1; i <= this.TotalPages; i++) {
      array.push(i);
    }
    return array;
  }

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
  
  protected goToPage(page: number) {
    if (page >= 1 && page <= this.TotalPages) {
      this.currentPage = page;
    }
  }

  protected getPartnerList() {
    const total = this.currentPage == this.TotalPages 
      ? this.PartnersList.length 
      : (this.currentPage * this.ItemsPerPage);

    let array: IPartner[] = [];
    for (let i = ((this.currentPage - 1) * this.ItemsPerPage); i < total; i++) {
      const partner = this.PartnersList.at(i);
      if (partner != undefined) {
        array.push(partner);
      }
    }

    return array;
  }
}
