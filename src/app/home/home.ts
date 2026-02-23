import { ChangeDetectorRef, Component, Injectable } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { HomeHeader } from "./home-header";
import { BehaviorSubject } from 'rxjs';
import { DatePipe } from '@angular/common';

export enum HomeCategories {
  AboutUs,
  Shop,
  Marketplace,
  DailyBread,
  Partners
};

export interface IPartner {
  img: string, 
  label: string,
  joinDate: string,
  rating: number,
  ratingCount: number,
  comment?: string
};

@Injectable({
  providedIn: 'root' // Makes the service a singleton and available throughout the app
})
export class HomeService {

  private _category = new BehaviorSubject<HomeCategories>(HomeCategories.AboutUs);

  public setCategory(category: HomeCategories) {
    this._category.next(category);
  }

  public getCategory(): HomeCategories {
    return this._category.value;
  }
}

@Component({
  selector: 'app-home',
  imports: [FontAwesomeModule, RouterModule, HomeHeader, DatePipe],
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

  protected homeCategories = HomeCategories;

  constructor(
    protected homeService: HomeService,
    private cdr: ChangeDetectorRef) { }

  protected ngOnInit() {
  }

  protected getHomeCategory(): HomeCategories {
    return this.homeService.getCategory();
  }
}
