import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ChatClientService, ClientEvent } from '../chat-client.service';
import { generateMockChannels } from '../mocks';
import { AvatarComponent } from './avatar.component';

describe('AvatarComponent', () => {
  let component: AvatarComponent;
  let fixture: ComponentFixture<AvatarComponent>;
  let nativeElement: HTMLElement;
  const imageUrl =
    'https://fastly.picsum.photos/id/615/200/300.jpg?hmac=ehJCfeXO1-ZbwBXgbYKroA97kTtoPKNoyEbCxnzsYfU';
  let queryImg: () => HTMLImageElement | null;
  let queryFallbackImg: () => HTMLImageElement | null;
  let queryOnlineIndicator: () => HTMLElement | null;
  let queryUsersMock: jasmine.Spy;
  let events$: Subject<ClientEvent>;
  let chatClientServiceMock: {
    chatClient: { user: { id: string }; queryUsers: jasmine.Spy };
    events$: Subject<ClientEvent>;
  };

  beforeEach(() => {
    queryUsersMock = jasmine.createSpy();
    events$ = new Subject();
    chatClientServiceMock = {
      chatClient: { user: { id: 'current-user' }, queryUsers: queryUsersMock },
      events$,
    };
    TestBed.configureTestingModule({
      declarations: [AvatarComponent],
      providers: [
        { provide: ChatClientService, useValue: chatClientServiceMock },
      ],
    });
    fixture = TestBed.createComponent(AvatarComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement as HTMLElement;
    queryFallbackImg = () =>
      nativeElement.querySelector('[data-testid=fallback-img]');
    queryImg = () => nativeElement.querySelector('[data-testid=avatar-img]');
    queryOnlineIndicator = () =>
      nativeElement.querySelector('[data-testid=online-indicator]');
  });

  const waitForImgComplete = () => {
    const img = queryImg();
    return new Promise((resolve, reject) => {
      if (!img) {
        return reject();
      }
      img.addEventListener('load', () => resolve(undefined));
      img.addEventListener('error', () => resolve(undefined));
    });
  };

  it('should display image', async () => {
    component.imageUrl = imageUrl;
    fixture.detectChanges();
    await waitForImgComplete();
    fixture.detectChanges();
    const img = queryImg();
    const fallbackImg = queryFallbackImg();

    expect(img).not.toBeNull();
    expect(fallbackImg).toBeNull();
    expect(img!.src).toBe(imageUrl);
    expect(
      img!.classList.contains('str-chat__avatar-image--loaded')
    ).toBeTrue();
  });

  it('should display image with the provided #size', () => {
    const size = 20;
    component.size = size;
    component.imageUrl = imageUrl;
    fixture.detectChanges();
    const img = queryImg();

    expect(img?.offsetHeight).toBe(size);
  });

  it(`should display fallback image if #imageUrl couldn't be loaded`, async () => {
    component.imageUrl = imageUrl + 'not-existing';
    fixture.detectChanges();
    await waitForImgComplete();
    fixture.detectChanges();
    const img = queryImg();
    const fallbackImg = queryFallbackImg();

    expect(img).toBeNull();
    expect(fallbackImg).not.toBeNull();
  });

  it(`should display fallback image if #imageUrl wasn't provided`, () => {
    component.name = 'John Doe';
    component.type = 'user';
    fixture.detectChanges();
    const img = queryImg();
    const fallbackImg = queryFallbackImg();

    expect(img).toBeNull();
    expect(fallbackImg).not.toBeNull();
    expect(fallbackImg!.textContent?.replace(/ /g, '')).toBe('J');
    expect(fallbackImg!.parentElement?.offsetHeight).toBe(component.size);
  });

  it('should display initials correctly', () => {
    component.type = 'user';
    component.name = 'John Doe';
    fixture.detectChanges();

    expect(component.initials).toBe('J');

    component.name = 'Johhny';
    fixture.detectChanges();

    expect(component.initials).toBe('J');

    component.name = undefined;
    fixture.detectChanges();

    expect(component.initials).toBe('');

    let channel = generateMockChannels()[0];
    channel.data!.name = undefined;
    component.channel = channel;
    component.type = 'channel';
    fixture.detectChanges();

    expect(component.initials).toBe('#');

    channel = generateMockChannels()[0];
    channel.data!.name = 'Test';
    channel.state.members = {
      otheruser: {
        user_id: 'otheruser',
        user: { id: 'otheruser', name: 'Jack' },
      },
      [chatClientServiceMock.chatClient.user.id]: {
        user_id: chatClientServiceMock.chatClient.user.id,
        user: { id: chatClientServiceMock.chatClient.user.id, name: 'Sara' },
      },
    };
    component.channel = channel;
    component.type = 'channel';
    fixture.detectChanges();

    expect(component.initials).toBe('T');

    channel = generateMockChannels()[0];
    channel.data!.name = undefined;
    channel.state.members = {
      otheruser: {
        user_id: 'otheruser',
        user: { id: 'otheruser', name: 'Jack' },
      },
      [chatClientServiceMock.chatClient.user.id]: {
        user_id: chatClientServiceMock.chatClient.user.id,
        user: { id: chatClientServiceMock.chatClient.user.id, name: 'Sara' },
      },
    };
    component.channel = channel;
    fixture.detectChanges();

    expect(component.initials).toBe('J');

    delete channel.state.members['otheruser'].user!.name;

    expect(component.initials).toBe('o');

    channel.state.members = {
      otheruser: {
        user_id: 'otheruser',
        user: { id: 'otheruser', name: 'Jack' },
      },
      otheruser2: {
        user_id: 'otheruser2',
        user: { id: 'otheruser2', name: 'Sara' },
      },
    };
    component.channel = channel;
    fixture.detectChanges();

    expect(component.initials).toBe('#');
  });

  it(`should display other user's image in 1:1 chats`, () => {
    const channel = generateMockChannels()[0];
    channel.state.members = {
      otheruser: {
        user_id: 'otheruser',
        user: { id: 'otheruser', name: 'Jack', image: 'url/to/img' },
      },
      [chatClientServiceMock.chatClient.user.id]: {
        user_id: chatClientServiceMock.chatClient.user.id,
        user: { id: chatClientServiceMock.chatClient.user.id, name: 'Sara' },
      },
    };
    component.imageUrl = undefined;
    component.channel = channel;
    component.type = 'channel';
    fixture.detectChanges();

    expect(queryImg()?.src).toContain('url/to/img');

    component.imageUrl = 'channel/img';
    fixture.detectChanges();

    expect(queryImg()?.src).toContain('channel/img');

    channel.state.members.otheruser.user!.image = undefined;
    component.imageUrl = undefined;
    fixture.detectChanges();

    expect(queryImg()).toBeNull();

    channel.state.members['thirduser'] = {
      user_id: 'thirduser',
      user: { id: 'thirduser', image: 'profile/img' },
    };
    fixture.detectChanges();

    expect(queryImg()).toBeNull();
  });

  it('should display online indicator in 1:1 channels', async () => {
    const channel = generateMockChannels()[0];
    channel.state.members = {
      otheruser: {
        user_id: 'otheruser',
        user: { id: 'otheruser', name: 'Jack', image: 'url/to/img' },
      },
      [chatClientServiceMock.chatClient.user.id]: {
        user_id: chatClientServiceMock.chatClient.user.id,
        user: { id: chatClientServiceMock.chatClient.user.id, name: 'Sara' },
      },
    };
    queryUsersMock.and.resolveTo({ users: [{ online: true }] });
    component.channel = channel;
    void component.ngOnChanges({ channel: {} as SimpleChange });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(queryOnlineIndicator()).not.toBeNull();
  });

  it('should only display online indicator if user is online', async () => {
    const channel = generateMockChannels()[0];
    channel.state.members = {
      otheruser: {
        user_id: 'otheruser',
        user: { id: 'otheruser', name: 'Jack', image: 'url/to/img' },
      },
      [chatClientServiceMock.chatClient.user.id]: {
        user_id: chatClientServiceMock.chatClient.user.id,
        user: { id: chatClientServiceMock.chatClient.user.id, name: 'Sara' },
      },
    };
    queryUsersMock.and.resolveTo({ users: [{ online: false }] });
    component.channel = channel;
    void component.ngOnChanges({ channel: {} as SimpleChange });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(queryOnlineIndicator()).toBeNull();
  });

  it(`should update online indicator if user's presence changed`, async () => {
    const channel = generateMockChannels()[0];
    channel.state.members = {
      otheruser: {
        user_id: 'otheruser',
        user: { id: 'otheruser', name: 'Jack', image: 'url/to/img' },
      },
      [chatClientServiceMock.chatClient.user.id]: {
        user_id: chatClientServiceMock.chatClient.user.id,
        user: { id: chatClientServiceMock.chatClient.user.id, name: 'Sara' },
      },
    };
    queryUsersMock.and.resolveTo({ users: [{ online: false }] });
    component.channel = channel;
    void component.ngOnChanges({ channel: {} as SimpleChange });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(queryOnlineIndicator()).toBeNull();

    events$.next({
      eventType: 'user.presence.changed',
      event: {
        type: 'user.presence.changed',
        user: { id: 'otheruser', online: true },
      },
    });
    fixture.detectChanges();

    expect(queryOnlineIndicator()).not.toBeNull();
  });

  it(`should handle query users error when displaying the online indicator`, async () => {
    const channel = generateMockChannels()[0];
    channel.state.members = {
      otheruser: {
        user_id: 'otheruser',
        user: {
          id: 'otheruser',
          name: 'Jack',
          image: 'url/to/img',
          online: true,
        },
      },
      [chatClientServiceMock.chatClient.user.id]: {
        user_id: chatClientServiceMock.chatClient.user.id,
        user: { id: chatClientServiceMock.chatClient.user.id, name: 'Sara' },
      },
    };
    queryUsersMock.and.rejectWith(new Error('Permission denied'));
    component.channel = channel;
    void component.ngOnChanges({ channel: {} as SimpleChange });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(queryOnlineIndicator()).not.toBeNull();
  });

  it(`shouldn't display online indicator in not 1:1 channels`, async () => {
    const channel = generateMockChannels()[0];
    channel.state.members = {
      otheruser: {
        user_id: 'otheruser',
        user: { id: 'otheruser', name: 'Jack', image: 'url/to/img' },
      },
      thirduser: {
        user_id: 'thirduser',
        user: { id: 'thirduser', name: 'John', image: 'url/to/img' },
      },
      [chatClientServiceMock.chatClient.user.id]: {
        user_id: chatClientServiceMock.chatClient.user.id,
        user: { id: chatClientServiceMock.chatClient.user.id, name: 'Sara' },
      },
    };
    queryUsersMock.and.resolveTo({ users: [{ online: true }] });
    component.channel = channel;
    void component.ngOnChanges({ channel: {} as SimpleChange });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(queryOnlineIndicator()).toBeNull();
  });

  it(`shouldn't display online indicator if #showOnlineIndicator is false`, async () => {
    const channel = generateMockChannels()[0];
    channel.state.members = {
      otheruser: {
        user_id: 'otheruser',
        user: { id: 'otheruser', name: 'Jack', image: 'url/to/img' },
      },
      [chatClientServiceMock.chatClient.user.id]: {
        user_id: chatClientServiceMock.chatClient.user.id,
        user: { id: chatClientServiceMock.chatClient.user.id, name: 'Sara' },
      },
    };
    queryUsersMock.and.resolveTo({ users: [{ online: true }] });
    component.channel = channel;
    void component.ngOnChanges({ channel: {} as SimpleChange });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(queryOnlineIndicator()).not.toBeNull();
  });
});
