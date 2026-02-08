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
