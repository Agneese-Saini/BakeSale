import { ChangeDetectorRef, Component } from "@angular/core"
import { FormsModule } from "@angular/forms"
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome"
import { IUser, UserRole, UserService } from "../user/user";

@Component({
  selector: 'social-post',
  imports: [FormsModule, FontAwesomeModule],
  template: `
<div class="flex flex-col pt-2 pb-4 items-center gap-8">
  <div class="flex flex-col gap-2">
    <div class="flex justify-between items-center">
      <div class="flex items-center gap-2">
        <button class="link flex gap-2 items-center" style="text-decoration: none;">
          <div class="avatar p-2">
            <div class="rounded-full w-8 h-8 lg:w-12 lg:h-12">
              <img src="https://img.daisyui.com/images/profile/demo/spiderperson@192.webp" />
            </div>
          </div>
          <div class="flex flex-col">
            <h1 class="font-bold">
              MyNameIsShady <fa-icon class="text-sm text-info tooltip" data-tip="Verified" icon="check-circle"></fa-icon>
            </h1>
            <p class="label text-xs">Following</p>
          </div>
        </button>

        <label class="font-bold label pr-2"><span class="status"></span> 1h</label>
      </div>

      <button class="btn btn-ghost btn-circle text-xl"><fa-icon icon="ellipsis"></fa-icon></button>
    </div>

    <div class="flex justify-center w-full bg-base-200">
    <div class="indicator w-fit">
      <img src="https://m.media-amazon.com/images/I/81KnMda0d4L._US500_.jpg" alt="Shoes" />

      <div class="indicator-item indicator-bottom" style="--indicator-x: -0.5em; --indicator-y: -0.5em;">
        <button class="btn btn-neutral font-mono uppercase opacity-75"><fa-icon icon="arrow-up-right-from-square"></fa-icon> Order This</button>
      </div>
    </div>
    </div>

    <div class="flex justify-between">
      <div class="flex items-center">
        <button class="btn btn-ghost btn-circle text-xl tooltip tooltip-bottom" data-tip="Like">
          <fa-icon icon="heart"></fa-icon>
        </button>
        <p class="text-sm">Liked by <a class="link font-bold" style="text-decoration: none;">Agneese</a> and
          <a class="link font-bold" style="text-decoration: none;">11,393</a> other
        </p>
      </div>

      <button class="btn btn-ghost btn-circle text-xl tooltip tooltip-bottom" data-tip="Share">
        <fa-icon icon="share"></fa-icon>
      </button>
    </div>

    <div class="flex flex-col gap-2 mt-auto">
      <p>
        <a class="link font-bold" style="text-decoration: none;">MyNameIsShady</a>
        Checkout my new recipe I just discovered for christmas week here at BakeSale.
      </p>
      <a class="link label text-sm w-fit" style="text-decoration: none;">View all 601 comments</a>
      <a class="link label w-fit" style="text-decoration: none;">Add a comment</a>
    </div>
  </div>
</div>
`
})
export class SocialPost {

  readonly userRole = UserRole;

  protected user: IUser = UserService.DefaultUser;

  constructor(
    private service: UserService,
    private cdr: ChangeDetectorRef) { }

  protected ngOnInit() {
    this.service.user$.subscribe(data => {
      this.user = data;
      this.cdr.detectChanges();
    });
  }
}