export const isBrowser = typeof window !== 'undefined';

export class BrowserImage {
	static create(): HTMLImageElement | null {
		if (isBrowser) {
			return new Image();
		}
		return null;
	}
}

export function createImage(): HTMLImageElement | null {
	return BrowserImage.create();
}
