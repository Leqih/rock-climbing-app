"""Train a climbing-hold detector (YOLO11) on a Roboflow export, then try it on a frame of our own wall.

    pip install ultralytics                                   # once; brings PyTorch (use the CUDA build for the GPU)
    python tools/holds_train.py train --data data/holds/holds.yaml
    python tools/holds_train.py train --resume                # if it stopped: carries on from the last epoch
    python tools/holds_train.py try --model runs/detect/holds/weights/best.pt --video wayup-p1-green@13.6

The data: Roboflow Universe, "Climbing Holds and Volumes" by Blackcreed (CC BY 4.0, 1,717 images, classes hold and
volume): https://universe.roboflow.com/blackcreed-xpgxh/climbing-holds-and-volumes. Download it yourself in the
YOLOv11 format (it needs a Roboflow sign-in; we use version 14, 4,301 images with Roboflow's augmentations) and
unzip it into data/holds/, which git ignores. Credit it wherever the model is shown.

Roboflow's data.yaml points at ../train/images, which ultralytics looks for outside the folder, and calls the classes
'0' and '1'. Train on a data/holds/holds.yaml of your own instead:

    path: <absolute path to data/holds>
    train: train/images
    val: valid/images
    test: test/images
    names: {0: hold, 1: volume}

`try` draws the boxes on a frame of one of our videos (or any photo) into tools/out/holds.jpg, so you can see whether
a detector trained on other gyms finds the holds on this wall before trusting it.
"""
import argparse, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'tools', 'out')


def train(a):
    from ultralytics import YOLO
    if a.resume:  # carries on from the last saved epoch with the run's own settings; only workers is changed
        return YOLO(os.path.join(ROOT, 'runs', 'detect', 'holds', 'weights', 'last.pt')).train(resume=True, workers=a.workers)
    if not a.data:
        raise SystemExit('train needs --data (or --resume)')
    YOLO(a.model).train(data=a.data, epochs=a.epochs, imgsz=a.imgsz, batch=a.batch, name='holds', workers=a.workers,
                        project=os.path.join(ROOT, 'runs', 'detect'), patience=20)


def try_on(a):
    import cv2
    from ultralytics import YOLO
    if '@' in a.video:                 # <video under video/>@<seconds>
        vid, t = a.video.split('@')
        cap = cv2.VideoCapture(os.path.join(ROOT, 'video', vid + '.mp4'))
        cap.set(cv2.CAP_PROP_POS_MSEC, float(t) * 1000)
        ok, img = cap.read(); cap.release()
        if not ok: raise SystemExit(f"can't read {a.video}")
    else:
        img = cv2.imread(a.video)
    r = YOLO(a.model)(img, imgsz=a.imgsz, conf=a.conf, verbose=False)[0]
    os.makedirs(OUT, exist_ok=True)
    cv2.imwrite(os.path.join(OUT, 'holds.jpg'), r.plot(labels=False, conf=False, line_width=2))
    print(f'{len(r.boxes)} holds found, drawn on tools/out/holds.jpg')


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest='cmd', required=True)
    t = sub.add_parser('train')
    t.add_argument('--data', help="the export's data.yaml")
    t.add_argument('--resume', action='store_true', help='carry on a run that stopped, from runs/detect/holds')
    t.add_argument('--workers', type=int, default=2,
                   help="image loaders; on Windows each is a whole Python+PyTorch process, and 8 ran out of memory")
    t.add_argument('--model', default='yolo11s.pt', help='the starting weights (s fits a laptop GPU; m or x on Modal)')
    t.add_argument('--epochs', type=int, default=100)
    t.add_argument('--imgsz', type=int, default=1024, help='holds are small: keep this high')
    t.add_argument('--batch', type=int, default=8)
    p = sub.add_parser('try')
    p.add_argument('--model', required=True)
    p.add_argument('--video', required=True, help='<video>@<seconds>, or a photo path')
    p.add_argument('--imgsz', type=int, default=1024)
    p.add_argument('--conf', type=float, default=0.3)
    a = ap.parse_args()
    train(a) if a.cmd == 'train' else try_on(a)


if __name__ == '__main__':
    main()
