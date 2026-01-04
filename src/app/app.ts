import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { SideDrawer } from "./sidedrawer/sidedrawer";
import { CheckoutDrawer } from './checkout/checkout-drawer';
import { filter } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [FormsModule, RouterOutlet, SideDrawer, CheckoutDrawer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  protected appDrawer = SideDrawer.name;
  protected appDrawerState: boolean = false; // "false" - the drawer is closed

  protected checkoutDrawer = CheckoutDrawer.name;
  protected checkoutDrawerState: boolean = false;


  constructor(
    private router: Router,
    protected fontAwesome: FaIconLibrary) { }

  protected ngOnInit() {
    this.fontAwesome.addIconPacks(fas);

    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((event: NavigationEnd) => {
      this.checkoutDrawerState = false;
      this.appDrawerState = false;
    });
  }
};