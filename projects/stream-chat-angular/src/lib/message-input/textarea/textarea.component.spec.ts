import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { ThemeService } from '../../theme.service';
import { EmojiInputService } from '../emoji-input.service';

import { TextareaComponent } from './textarea.component';

describe('TextareaComponent', () => {
  let component: TextareaComponent;
  let fixture: ComponentFixture<TextareaComponent>;
  let nativeElement: HTMLElement;
  let queryTextarea: () => HTMLTextAreaElement | null;
  let emojiInput$: Subject<string>;

  beforeEach(async () => {
    emojiInput$ = new Subject();
    await TestBed.configureTestingModule({
      declarations: [TextareaComponent],
      imports: [TranslateModule.forRoot()],
      providers: [
        {
          provide: EmojiInputService,
          useValue: { emojiInput$ },
        },
        {
          provide: ThemeService,
          useValue: { themeVersion: '2' },
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TextareaComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement as HTMLElement;
    queryTextarea = () =>
      nativeElement.querySelector('[data-testid="textarea"]');
    fixture.detectChanges();
  });

  it('should display textarea, and focus it', () => {
    const textarea = queryTextarea();

    expect(textarea).not.toBeNull();
    expect(textarea?.value).toBe('');
    expect(textarea?.hasAttribute('autofocus')).toBeTrue();
  });

  it('should display #value in textarea', () => {
    component.value = 'This is my message';
    fixture.detectChanges();

    expect(queryTextarea()?.value).toBe('This is my message');
  });

  it('should emit #valueChange if user types in textarea', () => {
    const spy = jasmine.createSpy();
    component.valueChange.subscribe(spy);
    const textarea = queryTextarea();
    textarea!.value = 'message';
    const event = new InputEvent('input');
    textarea?.dispatchEvent(event);
    fixture.detectChanges();

    expect(spy).toHaveBeenCalledWith('message');
  });

  it(`shouldn't emit #valueChange if enter is hit`, () => {
    const spy = jasmine.createSpy();
    component.valueChange.subscribe(spy);
    const textarea = queryTextarea();
    const message = 'This is my message';
    textarea!.value = message;
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    spyOn(event, 'preventDefault');
    fixture.detectChanges();

    expect(spy).not.toHaveBeenCalled();
  });

  it('should emit #send if enter is hit', () => {
    const spy = jasmine.createSpy();
    component.send.subscribe(spy);
    const textarea = queryTextarea();
    const message = 'This is my message';
    textarea!.value = message;
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    spyOn(event, 'preventDefault');
    textarea?.dispatchEvent(event);
    fixture.detectChanges();

    expect(spy).toHaveBeenCalledWith(undefined);
    expect(event.preventDefault).toHaveBeenCalledWith();
  });

  it(`shouldn't emit #send if shift+enter is hit`, () => {
    const spy = jasmine.createSpy();
    component.send.subscribe(spy);
    const textarea = queryTextarea();
    textarea!.value = 'This is my message';
    textarea?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true })
    );
    fixture.detectChanges();

    expect(spy).not.toHaveBeenCalled();
  });

  it('should insert emoji at the correct caret position', () => {
    const textarea = queryTextarea()!;
    textarea.value = 'Emoji here: !';
    textarea.setSelectionRange(12, 12);
    const spy = jasmine.createSpy();
    component.valueChange.subscribe(spy);
    spy.calls.reset();

    emojiInput$.next('🥑');

    expect(textarea.value).toEqual('Emoji here: 🥑!');
    expect(spy).toHaveBeenCalledWith('Emoji here: 🥑!');
  });

  it('shouldn increase and decrease textarea height with text input', () => {
    const spy = jasmine.createSpy();
    component.send.subscribe(spy);
    const textarea = queryTextarea();
    textarea!.value = 'This is my message';
    fixture.detectChanges();
    const initialHeight = textarea!.offsetHeight;
    textarea?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true })
    );
    textarea?.dispatchEvent(new KeyboardEvent('input', { key: 'R' }));
    fixture.detectChanges();
    const newHeight = textarea!.offsetHeight;

    expect(newHeight).toBeGreaterThan(initialHeight);

    component.value = '';
    component.ngOnChanges({ value: {} as SimpleChange });
    fixture.detectChanges();

    expect(textarea!.offsetHeight).toBeLessThan(newHeight);
  });
});
