import { Component } from "@angular/core";
import { RouterModule } from "@angular/router";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

@Component({
  imports: [FontAwesomeModule, RouterModule],
  template: `
<div class="bg-indigo-900 relative overflow-hidden h-[100vh]">
  <img
    src="https://external-preview.redd.it/4MddL-315mp40uH18BgGL2-5b6NIPHcDMBSWuN11ynM.jpg?width=960&crop=smart&auto=webp&s=b98d54a43b3dac555df398588a2c791e0f3076d9"
    class="absolute h-full w-full object-cover" />
  <div class="inset-0 bg-black opacity-25 absolute">
  </div>
  <div class="container mx-auto px-6 md:px-12 relative z-10 flex items-center py-32 xl:py-40">
    <div class="w-full font-mono flex flex-col items-center relative z-10">
      <h1 class="text-3xl text-center text-white leading-tight   opacity-5">
        You are all alone here
      </h1>
      <div class="flex flex-col my-32">
        <p class="font-extrabold text-8xl text-white animate-bounce">
          404<br />
          Page Not Found
        </p>
        <button class="btn w-fit px-6" routerLink="/">
          <fa-icon icon="home"></fa-icon> BakeSale Homepage
        </button>
      </div>
    </div>
  </div>
</div>
`
})
export class PageNotFound {
};