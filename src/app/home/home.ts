import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { HomeHeader } from "./home-header";
import { DatePipe } from '@angular/common';
import { Footer } from "../footer/footer";

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
  imports: [FontAwesomeModule, RouterModule, HomeHeader, DatePipe, Footer],
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

  protected ngOnInit() {
  }
}
