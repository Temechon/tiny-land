module CIV {
    export interface IClickable {
        activate();
        deactivate();
        getTexture(): string;
    }
}