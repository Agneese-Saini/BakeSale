import { ChangeDetectorRef, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { HomeHeader } from "./home-header";
import { HomeCategories, UserService } from '../user/user';

@Component({
  selector: 'app-home',
  imports: [FontAwesomeModule, RouterModule, HomeHeader],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {

  protected homeCategories = HomeCategories;

  constructor(
    protected userService: UserService,
    private cdr: ChangeDetectorRef) { }

  protected ngOnInit() {
  }
}
