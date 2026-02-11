import { ChangeDetectorRef, Component, Injectable } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { HomeHeader } from "./home-header";
import { BehaviorSubject } from 'rxjs';

export enum HomeCategories {
  AboutUs,
  Shop,
  Marketplace,
  DailyBread,
  Partners
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
  imports: [FontAwesomeModule, RouterModule, HomeHeader],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {

  protected readonly PartnersList: { img: string, label: string, about: string }[] = [
    {
      img: "https://www.gunnsbakery.com/wp-content/uploads/Gunns-Bakery-Logo-closed-with-white-bg-300x185.png", 
      label: "Gunns Bakery", 
      about: "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Laborum, adipisci."
    }, 
    {
      img: "https://goodiesbakeshop.com/wp-content/uploads/2021/08/Goodies-Logo-e1630347378677.png", 
      label: "Goodies", 
      about: "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Laborum, adipisci."
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
