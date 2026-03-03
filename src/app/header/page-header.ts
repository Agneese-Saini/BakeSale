import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Router } from '@angular/router';
import { IUser, UserRole, UserService } from '../user/user';
import { SideDrawer } from '../sidedrawer/sidedrawer';

@Component({
  selector: 'page-header',
  imports: [FormsModule, FontAwesomeModule],
  templateUrl: './page-header.html'
})
export class PageHeader {

  protected appDrawer = SideDrawer.name;
  protected userRole = UserRole;

  @Input()
  public page: string = 'Homepage';

  @Input()
  public icon: string = 'home';

  protected user: IUser = UserService.DefaultUser;

  constructor(
    private router: Router,
    private userService: UserService,
    private cdr: ChangeDetectorRef) { }

  protected ngOnInit() {    
    this.userService.user$.subscribe(data => {
      this.user = data;
      this.cdr.detectChanges();
    });
  }

  protected onClickHome() {
    this.router.navigate(['/']);
  }
};