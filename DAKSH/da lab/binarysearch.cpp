#include <iostream>
using namespace std;

int binarySearch(int a[], int x, int l, int h) {
	while (l <= h) {
		int m = l + (h - l) / 2;
		if (a[m] == x)
			return m;
		if (a[m] < x)
			l = m + 1;
		else
			h = m - 1;
	}
	return -1;
}

int main() {
	int n, x;
	cout << "Enter number of elements: ";
	cin >> n;
	int a[n];
	cout << "Enter " << n << " sorted elements: ";
	for (int i = 0; i < n; i++)
		cin >> a[i];
	cout << "Enter element to search: ";
	cin >> x;

	int r = binarySearch(a, x, 0, n - 1);
	if (r == -1)
		cout << "Not found";
	else
		cout << "Element found at index " << r;
}
