import { ChangeDetectorRef, Component, Inject, Input } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome"
import { IUser, UserRole, UserService } from "../user/user";
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogModule, MatDialogRef } from "@angular/material/dialog";

export enum MediaType {
  Photo,
  Video,
  GIF
};

export interface ISocialPost {
  user: IUser,
  media: { type: MediaType, src: string }[]
};

@Component({
  selector: 'social-post',
  imports: [CommonModule, FontAwesomeModule],
  template: `
<div class="flex flex-col pt-2 pb-4 items-center gap-8">
  <div class="flex flex-col gap-2">
    <div class="flex justify-end items-center">
      <button class="btn btn-ghost btn-circle text-xl" (click)="openOptionsDialog()"><fa-icon icon="ellipsis"></fa-icon></button>
    </div>

    <div class="indicator flex justify-center w-full bg-base-200">
      <div class="indicator-item indicator-bottom indicator-start" style="--indicator-x: 0.5em; --indicator-y: -0.5em;">
        <button tabindex="0" role="button" class="btn btn-ghost btn-xl btn-circle avatar tooltip tooltip-right" [attr.data-tip]="(social.user.userRole == userRole.Chef ? 'Chef ' : '') + social.user.name">
          <div [class]="'rounded-full shadow shadow-xl ring-offset-base-100 ring-2' + ' ' + (social.user.userRole == userRole.Chef ? 'ring-neutral' : 'ring-neutral-300')">
            <img src="https://img.daisyui.com/images/profile/demo/1@94.webp" />
          </div>
        </button>
      </div>

      <img class="h-84 lg:h-128" [src]="social.media[selectedMedia].src" />
    </div>
    
    @if (social.media.length > 1) {
    <div class="flex flex-wrap gap-2 justify-center">
      @for (media of social.media; track $index) {
      <div class="link indicator" (click)="selectedMedia=$index;">
        @if (media.type == mediaType.Video) {
        <div class="indicator-item indicator-middle indicator-center" style="--indicator-x: -0.5em; --indicator-y: -0.75em;">
          <fa-icon class="text-white opacity-75" icon="play"></fa-icon>
        </div>
        }
        <img [class]="'rounded-box size-8 border border-base-300' + ' ' + (selectedMedia == $index ? 'ring' : '')" [src]="media.src" />
      </div>
      }
    </div>
    }

    <div class="flex items-center">
      <button class="btn btn-ghost btn-circle text-xl tooltip tooltip-bottom" data-tip="Like">
        <fa-icon [icon]="['far', 'heart']"></fa-icon>
      </button>
      <p class="text-sm">Liked by <a class="link font-bold" style="text-decoration: none;">Agneese</a> and
        <a class="link font-bold" style="text-decoration: none;">11,393</a> other
      </p>
    </div>

    <div class="flex flex-col gap-2">
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam ac eros sit amet lorem facilisis vulputate at non dui.
      </p>
    </div>
    <div class="flex justify-end">
      <i class="text-xs label">Posted an hour ago</i>
    </div>
  </div>
</div>
`
})
export class SocialPost {

  readonly userRole = UserRole;
  readonly mediaType = MediaType;

  @Input({ required: true })
  public social!: ISocialPost;

  protected user?: IUser;
  protected selectedMedia: number = 0;

  constructor(
    private service: UserService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef) {
  }

  protected ngOnInit() {
    this.service.user$.subscribe(data => {
      this.user = data;
      this.cdr.detectChanges();
    });
  }

  protected openOptionsDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = "";
    dialogConfig.data = this.social;

    const dialogRef = this.dialog.open(OptionsDialog, dialogConfig);
    dialogRef.afterClosed().subscribe(() => {
      this.cdr.detectChanges();
    });
  }
}


@Component({
  imports: [CommonModule, FontAwesomeModule, MatDialogModule],
  template: `
<div class="bg-base-200">
  <div mat-dialog-actions>
    <table class="table">
      <tbody>
        <tr>
          <td class="flex justify-center w-full">
            <a class="link" style="text-decoration: none;">View Likes</a>
          </td>
        </tr>
        <tr>
          <td class="flex justify-center w-full">
            <a class="link" style="text-decoration: none;">View Author's Profile</a>
          </td>
        </tr>
        <tr>
          <td class="flex justify-center w-full">
            <a class="link" style="text-decoration: none;">Save Post</a>
          </td>
        </tr>
        <tr>
          <td class="flex justify-center w-full">
            <a class="link text-error" style="text-decoration: none;">Report Post</a>
          </td>
        </tr>
        <tr>
          <td class="flex justify-center w-full">
            <a class="link" style="text-decoration: none;" (click)="closeDialog()">Close</a>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
`
})
export class OptionsDialog {

  constructor(
    @Inject(MAT_DIALOG_DATA) protected data: ISocialPost,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<OptionsDialog>,
    private cdr: ChangeDetectorRef) { }

  protected closeDialog() {
    this.dialogRef.close();
  }
}